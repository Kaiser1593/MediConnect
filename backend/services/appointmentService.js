// backend/services/appointmentService.js
// Logique métier de la prise de rendez-vous : calcul des créneaux
// disponibles et validation d'une réservation. Les modèles ne font que
// du SQL, les contrôleurs ne font que du routage : cette logique vit ici.

const doctorModel = require("../models/doctorModel");
const patientModel = require("../models/patientModel");
const appointmentModel = require("../models/appointmentModel");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}:00`;
};

// weekday : 1 = lundi ... 7 = dimanche (norme ISO-8601, comme en base).
// "T00:00:00" force une interprétation en heure locale : sans ça,
// new Date("2026-08-20") est lu en UTC et peut retomber sur la veille
// une fois reconverti en jour local selon le fuseau du serveur.
const getIsoWeekday = (dateStr) => {
  const jsDay = new Date(`${dateStr}T00:00:00`).getDay();
  return jsDay === 0 ? 7 : jsDay;
};

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getTodayIso = () => new Date().toISOString().slice(0, 10);

// Calcule les créneaux libres d'un médecin pour une date donnée, en
// croisant ses horaires récurrents avec les rendez-vous déjà pris.
const computeAvailableSlots = async (doctor, dateStr) => {
  if (!DATE_PATTERN.test(dateStr)) {
    throw makeError("La date doit être au format AAAA-MM-JJ.", 400);
  }

  const today = getTodayIso();

  if (dateStr < today) {
    return [];
  }

  const weekday = getIsoWeekday(dateStr);

  const [availabilities, bookedStartTimes] = await Promise.all([
    doctorModel.getWeeklyAvailabilities(doctor.doctor_id),
    doctorModel.getBookedStartTimes(doctor.doctor_id, dateStr),
  ]);

  const bookedSet = new Set(bookedStartTimes);
  const slotDuration = doctor.slot_duration;
  const nowMinutes =
    dateStr === today
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : -1;

  const slots = [];

  availabilities
    .filter((availability) => availability.weekday === weekday)
    .forEach((availability) => {
      const start = parseTimeToMinutes(availability.start_time);
      const end = parseTimeToMinutes(availability.end_time);

      for (
        let minutes = start;
        minutes + slotDuration <= end;
        minutes += slotDuration
      ) {
        if (minutes <= nowMinutes) continue;

        const slotTime = minutesToTime(minutes);

        if (!bookedSet.has(slotTime)) {
          slots.push(slotTime.slice(0, 5));
        }
      }
    });

  return slots;
};

// Valide puis enregistre une réservation. Recalcule les créneaux
// disponibles côté serveur : on ne fait jamais confiance à ce que
// le client affirme avoir vu comme libre.
const bookAppointment = async ({
  patientUserId,
  doctorId,
  scheduledOn,
  startTime,
  reason,
}) => {
  const patient = await patientModel.findByUserId(patientUserId);

  if (!patient) {
    throw makeError("Fiche patient introuvable.", 404);
  }

  const doctor = await doctorModel.getPublicById(doctorId);

  if (!doctor) {
    throw makeError("Médecin introuvable ou non disponible.", 404);
  }

  const availableSlots = await computeAvailableSlots(doctor, scheduledOn);
  const normalizedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;

  if (!availableSlots.includes(normalizedStartTime.slice(0, 5))) {
    throw makeError("Ce créneau n'est plus disponible.", 409);
  }

  const startMinutes = parseTimeToMinutes(normalizedStartTime);
  const endTime = minutesToTime(startMinutes + doctor.slot_duration);

  // La contrainte UNIQUE du créneau porte sur (doctor_id, scheduled_on,
  // start_time) sans tenir compte du statut : un rendez-vous annulé sur ce
  // créneau doit être réactivé, pas dupliqué (sinon la contrainte le refuse).
  const existing = await appointmentModel.findByDoctorSlot(
    doctorId,
    scheduledOn,
    normalizedStartTime,
  );

  if (existing) {
    await appointmentModel.reactivate(existing.id, {
      patientId: patient.id,
      endTime,
      reason,
    });

    return {
      id: existing.id,
      patientId: patient.id,
      doctorId,
      scheduledOn,
      startTime: normalizedStartTime,
      endTime,
      reason: reason || null,
      status: "pending",
    };
  }

  return appointmentModel.create({
    patientId: patient.id,
    doctorId,
    scheduledOn,
    startTime: normalizedStartTime,
    endTime,
    reason,
  });
};

// Données du tableau de bord patient : rendez-vous à venir + statistiques.
const getPatientDashboard = async (userId) => {
  const patient = await patientModel.findByUserId(userId);

  if (!patient) {
    throw makeError("Fiche patient introuvable.", 404);
  }

  const today = getTodayIso();

  const [stats, appointments] = await Promise.all([
    appointmentModel.getPatientStats(patient.id, today),
    appointmentModel.getPatientAppointments(patient.id, today, 5),
  ]);

  return { stats, appointments };
};

// Données du tableau de bord médecin : rendez-vous du jour, statistiques
// et horaires récurrents (utile même si le compte n'est pas encore validé).
const getDoctorDashboard = async (userId) => {
  const doctor = await doctorModel.findByUserId(userId);

  if (!doctor) {
    throw makeError("Fiche médecin introuvable.", 404);
  }

  const today = getTodayIso();

  const [stats, appointments, availabilities] = await Promise.all([
    appointmentModel.getDoctorStats(doctor.id, today),
    appointmentModel.getDoctorTodayAppointments(doctor.id, today),
    doctorModel.getWeeklyAvailabilities(doctor.id),
  ]);

  return { stats, appointments, availabilities };
};

// Liste complète des rendez-vous de l'utilisateur connecté, quel que
// soit son rôle : page "Mes rendez-vous" (patient) ou "Mon agenda" (médecin).
const listMyAppointments = async (user) => {
  if (user.role === "doctor") {
    const doctor = await doctorModel.findByUserId(user.id);

    if (!doctor) {
      throw makeError("Fiche médecin introuvable.", 404);
    }

    return appointmentModel.getAllByDoctorId(doctor.id);
  }

  const patient = await patientModel.findByUserId(user.id);

  if (!patient) {
    throw makeError("Fiche patient introuvable.", 404);
  }

  return appointmentModel.getAllByPatientId(patient.id);
};

// Annule un rendez-vous, côté patient ou côté médecin. Vérifie que
// l'utilisateur connecté est bien partie prenante du rendez-vous : on ne
// fait jamais confiance à un identifiant transmis par le client seul.
const cancelAppointment = async (user, appointmentId) => {
  const appointment = await appointmentModel.findById(appointmentId);

  if (!appointment) {
    throw makeError("Rendez-vous introuvable.", 404);
  }

  if (appointment.status === "cancelled" || appointment.status === "completed") {
    throw makeError("Ce rendez-vous ne peut plus être annulé.", 400);
  }

  if (user.role === "doctor") {
    const doctor = await doctorModel.findByUserId(user.id);

    if (!doctor || doctor.id !== appointment.doctor_id) {
      throw makeError("Ce rendez-vous ne vous appartient pas.", 403);
    }
  } else {
    const patient = await patientModel.findByUserId(user.id);

    if (!patient || patient.id !== appointment.patient_id) {
      throw makeError("Ce rendez-vous ne vous appartient pas.", 403);
    }
  }

  await appointmentModel.cancel(appointmentId);
};

// Patients distincts d'un médecin, pour la page "Mes patients".
const listMyPatients = async (userId) => {
  const doctor = await doctorModel.findByUserId(userId);

  if (!doctor) {
    throw makeError("Fiche médecin introuvable.", 404);
  }

  return appointmentModel.getDistinctPatientsForDoctor(doctor.id);
};

module.exports = {
  computeAvailableSlots,
  bookAppointment,
  getPatientDashboard,
  getDoctorDashboard,
  listMyAppointments,
  cancelAppointment,
  listMyPatients,
};
