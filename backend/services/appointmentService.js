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

module.exports = {
  computeAvailableSlots,
  bookAppointment,
  getPatientDashboard,
  getDoctorDashboard,
};
