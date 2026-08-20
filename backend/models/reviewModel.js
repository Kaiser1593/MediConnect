// backend/models/reviewModel.js
// Toutes les requêtes SQL touchant à la table reviews.

const { pool } = require("../config/database");

// Un seul avis par rendez-vous (contrainte UNIQUE en base) : on vérifie
// son existence avant insertion pour renvoyer un message clair plutôt
// qu'une erreur SQL brute.
const findByAppointmentId = async (appointmentId) => {
  const [rows] = await pool.query(
    "SELECT id FROM reviews WHERE appointment_id = ? LIMIT 1",
    [appointmentId],
  );

  return rows[0] || null;
};

const create = async ({ appointmentId, patientId, doctorId, rating, comment }) => {
  const [result] = await pool.query(
    `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [appointmentId, patientId, doctorId, rating, comment || null],
  );

  return {
    id: result.insertId,
    appointmentId,
    patientId,
    doctorId,
    rating,
    comment: comment || null,
  };
};

// Avis publics d'un médecin, les plus récents d'abord.
const getByDoctorId = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.firstname, u.lastname
     FROM reviews r
     JOIN patients p ON p.id = r.patient_id
     JOIN users u    ON u.id = p.user_id
     WHERE r.doctor_id = ?
     ORDER BY r.created_at DESC`,
    [doctorId],
  );

  return rows;
};

module.exports = {
  findByAppointmentId,
  create,
  getByDoctorId,
};
