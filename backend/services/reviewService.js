// backend/services/reviewService.js
// Logique métier des avis : un patient ne peut évaluer que ses propres
// rendez-vous, une fois la consultation terminée, et une seule fois.

const appointmentModel = require("../models/appointmentModel");
const patientModel = require("../models/patientModel");
const reviewModel = require("../models/reviewModel");

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createReview = async (userId, { appointmentId, rating, comment }) => {
  const patient = await patientModel.findByUserId(userId);

  if (!patient) {
    throw makeError("Fiche patient introuvable.", 404);
  }

  const appointment = await appointmentModel.findById(appointmentId);

  if (!appointment) {
    throw makeError("Rendez-vous introuvable.", 404);
  }

  if (appointment.patient_id !== patient.id) {
    throw makeError("Ce rendez-vous ne vous appartient pas.", 403);
  }

  if (appointment.status !== "completed") {
    throw makeError(
      "Seul un rendez-vous terminé peut faire l'objet d'un avis.",
      400,
    );
  }

  const existing = await reviewModel.findByAppointmentId(appointmentId);

  if (existing) {
    throw makeError("Vous avez déjà laissé un avis pour ce rendez-vous.", 409);
  }

  return reviewModel.create({
    appointmentId,
    patientId: patient.id,
    doctorId: appointment.doctor_id,
    rating,
    comment,
  });
};

const listDoctorReviews = (doctorId) => reviewModel.getByDoctorId(doctorId);

module.exports = {
  createReview,
  listDoctorReviews,
};
