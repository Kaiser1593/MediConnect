// backend/models/adminModel.js
// Toutes les requêtes SQL réservées à l'espace administrateur.
// Aucune logique métier ici : uniquement l'accès aux données.

const { pool } = require("../config/database");

const getStats = async () => {
  const [[userRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM users",
  );

  const [[approvedDoctorRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM doctors WHERE is_approved = TRUE",
  );

  const [[pendingDoctorRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM doctors WHERE is_approved = FALSE",
  );

  const [[appointmentRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointments",
  );

  return {
    totalUsers: userRow.total,
    approvedDoctors: approvedDoctorRow.total,
    pendingDoctors: pendingDoctorRow.total,
    totalAppointments: appointmentRow.total,
  };
};

const getUsers = async ({ limit, offset }) => {
  const [rows] = await pool.query(
    `SELECT id, firstname, lastname, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM users");

  return { rows, total };
};

const getPendingDoctors = async () => {
  const [rows] = await pool.query(
    `SELECT d.id, d.license_number, d.city, d.created_at,
            u.id AS user_id, u.firstname, u.lastname, u.email
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     WHERE d.is_approved = FALSE
     ORDER BY d.created_at DESC`,
  );

  return rows;
};

const approveDoctor = async (doctorId) => {
  const [result] = await pool.query(
    "UPDATE doctors SET is_approved = TRUE WHERE id = ?",
    [doctorId],
  );

  return result.affectedRows > 0;
};

const setUserActiveStatus = async (userId, isActive) => {
  const [result] = await pool.query(
    "UPDATE users SET is_active = ? WHERE id = ?",
    [isActive, userId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  getStats,
  getUsers,
  getPendingDoctors,
  approveDoctor,
  setUserActiveStatus,
};
