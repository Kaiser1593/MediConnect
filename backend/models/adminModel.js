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

// Tous les médecins (validés et en attente), pour la page "Médecins".
const getAllDoctors = async ({ limit, offset }) => {
  const [rows] = await pool.query(
    `SELECT d.id, d.license_number, d.city, d.is_approved, d.created_at,
            u.id AS user_id, u.firstname, u.lastname, u.email,
            s.name AS specialty
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN specialties s ON s.id = d.specialty_id
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) AS total FROM doctors",
  );

  return { rows, total };
};

// Tous les rendez-vous de la plateforme, avec patient et médecin joints.
const getAllAppointments = async ({ limit, offset, status }) => {
  const whereClause = status ? "WHERE a.status = ?" : "";
  const params = status ? [status] : [];

  const [rows] = await pool.query(
    `SELECT a.id, a.scheduled_on, a.start_time, a.status,
            pu.firstname AS patient_firstname, pu.lastname AS patient_lastname,
            du.firstname AS doctor_firstname, du.lastname AS doctor_lastname
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users pu   ON pu.id = p.user_id
     JOIN doctors d  ON d.id = a.doctor_id
     JOIN users du   ON du.id = d.user_id
     ${whereClause}
     ORDER BY a.scheduled_on DESC, a.start_time DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments a ${whereClause}`,
    params,
  );

  return { rows, total };
};

// Répartitions utilisées par la page "Statistiques".
const getUsersByRole = async () => {
  const [rows] = await pool.query(
    "SELECT role, COUNT(*) AS total FROM users GROUP BY role",
  );

  return rows;
};

const getAppointmentsByStatus = async () => {
  const [rows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM appointments GROUP BY status",
  );

  return rows;
};

const getDoctorsBySpecialty = async () => {
  const [rows] = await pool.query(
    `SELECT COALESCE(s.name, 'Non renseignée') AS specialty, COUNT(*) AS total
     FROM doctors d
     LEFT JOIN specialties s ON s.id = d.specialty_id
     GROUP BY s.name
     ORDER BY total DESC`,
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

// Journaux de sécurité, les plus récents d'abord, avec filtre optionnel
// par type d'événement, pour la page "Journaux" de l'espace administrateur.
const getSecurityLogs = async ({ limit, offset, eventType }) => {
  const whereClause = eventType ? "WHERE l.event_type = ?" : "";
  const params = eventType ? [eventType] : [];

  const [rows] = await pool.query(
    `SELECT l.id, l.event_type, l.message, l.ip_address, l.created_at,
            u.id AS user_id, u.firstname, u.lastname
     FROM security_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM security_logs l ${whereClause}`,
    params,
  );

  return { rows, total };
};

module.exports = {
  getStats,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  getAllAppointments,
  getUsersByRole,
  getAppointmentsByStatus,
  getDoctorsBySpecialty,
  approveDoctor,
  setUserActiveStatus,
  getSecurityLogs,
};
