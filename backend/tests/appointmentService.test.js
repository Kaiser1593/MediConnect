// backend/tests/appointmentService.test.js
// Tests unitaires (modèles mockés, aucune base réelle) sur les deux
// règles métier centrales de la réservation : le calcul des créneaux
// disponibles et les règles d'annulation.

jest.mock("../models/doctorModel");
jest.mock("../models/patientModel");
jest.mock("../models/appointmentModel");
jest.mock("../services/notificationService");
jest.mock("../services/cacheService");

const doctorModel = require("../models/doctorModel");
const patientModel = require("../models/patientModel");
const appointmentModel = require("../models/appointmentModel");
const notificationService = require("../services/notificationService");
const cacheService = require("../services/cacheService");

const appointmentService = require("../services/appointmentService");

// Un lundi certain dans le futur, jamais "aujourd'hui" : évite toute
// dépendance à l'heure d'exécution du test (le filtre "créneau déjà
// passé" ne s'applique qu'à la date du jour, voir appointmentService).
const FUTURE_MONDAY = "2099-01-05";

describe("computeAvailableSlots", () => {
  const doctor = { doctor_id: 1, slot_duration: 30 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejette une date mal formée", async () => {
    await expect(
      appointmentService.computeAvailableSlots(doctor, "05/01/2099"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("ne renvoie aucun créneau pour une date déjà passée", async () => {
    const slots = await appointmentService.computeAvailableSlots(doctor, "2000-01-01");

    expect(slots).toEqual([]);
    // Ne consulte même pas la base pour une date déjà exclue.
    expect(doctorModel.getWeeklyAvailabilities).not.toHaveBeenCalled();
  });

  it("découpe les disponibilités en créneaux de la durée du médecin, en excluant les créneaux déjà pris et les autres jours de la semaine", async () => {
    doctorModel.getWeeklyAvailabilities.mockResolvedValue([
      { weekday: 1, start_time: "09:00:00", end_time: "10:00:00" },
      // Mardi : ne doit jamais apparaître pour une requête sur un lundi.
      { weekday: 2, start_time: "14:00:00", end_time: "15:00:00" },
    ]);
    doctorModel.getBookedStartTimes.mockResolvedValue(["09:30:00"]);

    const slots = await appointmentService.computeAvailableSlots(doctor, FUTURE_MONDAY);

    expect(slots).toEqual(["09:00"]);
    expect(doctorModel.getWeeklyAvailabilities).toHaveBeenCalledWith(1);
    expect(doctorModel.getBookedStartTimes).toHaveBeenCalledWith(1, FUTURE_MONDAY);
  });

  it("ne renvoie rien si toutes les disponibilités du jour sont déjà prises", async () => {
    doctorModel.getWeeklyAvailabilities.mockResolvedValue([
      { weekday: 1, start_time: "09:00:00", end_time: "09:30:00" },
    ]);
    doctorModel.getBookedStartTimes.mockResolvedValue(["09:00:00"]);

    const slots = await appointmentService.computeAvailableSlots(doctor, FUTURE_MONDAY);

    expect(slots).toEqual([]);
  });
});

describe("cancelAppointment", () => {
  const PATIENT_USER = { id: 10, role: "patient" };
  const DOCTOR_USER = { id: 20, role: "doctor" };

  const buildAppointment = (overrides = {}) => ({
    id: 1,
    patient_id: 100,
    doctor_id: 200,
    status: "pending",
    scheduled_on: new Date("2099-01-05"),
    start_time: "09:00:00",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejette l'annulation d'un rendez-vous introuvable", async () => {
    appointmentModel.findById.mockResolvedValue(null);

    await expect(
      appointmentService.cancelAppointment(PATIENT_USER, 999),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejette l'annulation d'un rendez-vous déjà annulé ou terminé", async () => {
    appointmentModel.findById.mockResolvedValue(buildAppointment({ status: "cancelled" }));

    await expect(
      appointmentService.cancelAppointment(PATIENT_USER, 1),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuse à un patient d'annuler le rendez-vous d'un autre patient", async () => {
    appointmentModel.findById.mockResolvedValue(buildAppointment({ patient_id: 999 }));
    patientModel.findByUserId.mockResolvedValue({ id: 100 });

    await expect(
      appointmentService.cancelAppointment(PATIENT_USER, 1),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(appointmentModel.cancel).not.toHaveBeenCalled();
  });

  it("refuse à un médecin d'annuler le rendez-vous d'un autre médecin", async () => {
    appointmentModel.findById.mockResolvedValue(buildAppointment({ doctor_id: 999 }));
    doctorModel.findByUserId.mockResolvedValue({ id: 200 });

    await expect(
      appointmentService.cancelAppointment(DOCTOR_USER, 1),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(appointmentModel.cancel).not.toHaveBeenCalled();
  });

  it("autorise le patient propriétaire à annuler et invalide le cache de disponibilité", async () => {
    const appointment = buildAppointment();
    appointmentModel.findById.mockResolvedValue(appointment);
    patientModel.findByUserId.mockResolvedValue({ id: 100 });
    doctorModel.getUserIdById.mockResolvedValue(20);

    await appointmentService.cancelAppointment(PATIENT_USER, 1);

    expect(appointmentModel.cancel).toHaveBeenCalledWith(1);
    expect(cacheService.invalidateAvailability).toHaveBeenCalledWith(200, "2099-01-05");
    expect(notificationService.notifyAppointmentCancelled).toHaveBeenCalled();
  });
});
