// backend/models/reviewModel.js
// Toutes les requêtes SQL touchant à la table avis.

const { pool } = require("../config/database");

// Un seul avis par rendez-vous (contrainte UNIQUE en base) : on vérifie
// son existence avant insertion pour renvoyer un message clair plutôt
// qu'une erreur SQL brute.
const findByAppointmentId = async (appointmentId) => {
  const [rows] = await pool.query(
    "SELECT id FROM avis WHERE rendez_vous_id = ? LIMIT 1",
    [appointmentId],
  );

  return rows[0] || null;
};

const create = async ({ appointmentId, patientId, doctorId, rating, comment }) => {
  const [result] = await pool.query(
    `INSERT INTO avis (rendez_vous_id, patient_id, medecin_id, note, commentaire)
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
    `SELECT a.id, a.note AS rating, a.commentaire AS comment,
            a.date_creation AS created_at, u.prenom AS firstname, u.nom AS lastname
     FROM avis a
     JOIN patients p ON p.id = a.patient_id
     JOIN utilisateurs u ON u.id = p.utilisateur_id
     WHERE a.medecin_id = ?
     ORDER BY a.date_creation DESC`,
    [doctorId],
  );

  return rows;
};

module.exports = {
  findByAppointmentId,
  create,
  getByDoctorId,
};
