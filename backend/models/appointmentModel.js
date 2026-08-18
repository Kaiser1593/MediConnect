// backend/models/appointmentModel.js
// Toutes les requêtes SQL touchant à la table appointments.

const { pool } = require("../config/database");

const create = async ({
  patientId,
  doctorId,
  scheduledOn,
  startTime,
  endTime,
  reason,
}) => {
  const [result] = await pool.query(
    `INSERT INTO appointments
       (patient_id, doctor_id, scheduled_on, start_time, end_time, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [patientId, doctorId, scheduledOn, startTime, endTime, reason || null],
  );

  return {
    id: result.insertId,
    patientId,
    doctorId,
    scheduledOn,
    startTime,
    endTime,
    reason: reason || null,
    status: "pending",
  };
};

// La contrainte UNIQUE (doctor_id, scheduled_on, start_time) porte sur le
// créneau, pas sur son statut : un rendez-vous annulé occupe donc toujours
// la ligne. Avant de réserver, on vérifie s'il en existe déjà une pour ce
// créneau (annulée ou non) afin de la réactiver plutôt que d'entrer en
// conflit avec elle.
const findByDoctorSlot = async (doctorId, scheduledOn, startTime) => {
  const [rows] = await pool.query(
    `SELECT id, status
     FROM appointments
     WHERE doctor_id = ? AND scheduled_on = ? AND start_time = ?
     LIMIT 1`,
    [doctorId, scheduledOn, startTime],
  );

  return rows[0] || null;
};

// Réutilise une ligne annulée pour une nouvelle réservation, plutôt que
// d'insérer un doublon qui violerait la contrainte UNIQUE du créneau.
const reactivate = async (id, { patientId, endTime, reason }) => {
  await pool.query(
    `UPDATE appointments
     SET patient_id = ?, end_time = ?, reason = ?, status = 'pending', doctor_notes = NULL
     WHERE id = ?`,
    [patientId, endTime, reason || null, id],
  );

  return { id, patientId, endTime, reason: reason || null, status: "pending" };
};

// Statistiques du tableau de bord patient. "today" est fourni par l'appelant
// (calculé côté service) plutôt que CURDATE(), pour rester cohérent avec la
// date utilisée par le calcul des créneaux, qui ne dépend pas du fuseau
// horaire du serveur MySQL.
const getPatientStats = async (patientId, today) => {
  const [[upcomingRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE patient_id = ? AND status IN ('pending', 'confirmed')
       AND scheduled_on >= ?`,
    [patientId, today],
  );

  const [[completedRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE patient_id = ? AND status = 'completed'`,
    [patientId],
  );

  const [[cancelledRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE patient_id = ? AND status = 'cancelled'`,
    [patientId],
  );

  const [[totalRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointments WHERE patient_id = ?",
    [patientId],
  );

  return {
    upcoming: upcomingRow.total,
    completed: completedRow.total,
    cancelled: cancelledRow.total,
    total: totalRow.total,
  };
};

// Rendez-vous à venir d'un patient, triés du plus proche au plus lointain.
const getPatientAppointments = async (patientId, today, limit) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.scheduled_on, a.start_time, a.status,
            u.firstname, u.lastname,
            CONCAT('Dr ', u.firstname, ' ', u.lastname) AS doctor_name,
            s.name AS specialty
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users u   ON u.id = d.user_id
     LEFT JOIN specialties s ON s.id = d.specialty_id
     WHERE a.patient_id = ?
       AND a.status IN ('pending', 'confirmed')
       AND a.scheduled_on >= ?
     ORDER BY a.scheduled_on, a.start_time
     LIMIT ?`,
    [patientId, today, limit],
  );

  return rows;
};

// Statistiques du tableau de bord médecin.
const getDoctorStats = async (doctorId, today) => {
  const [[todayRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND scheduled_on = ? AND status != 'cancelled'`,
    [doctorId, today],
  );

  const [[patientsRow]] = await pool.query(
    "SELECT COUNT(DISTINCT patient_id) AS total FROM appointments WHERE doctor_id = ?",
    [doctorId],
  );

  const monthStart = `${today.slice(0, 7)}-01`;

  const [[completedRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND status = 'completed' AND scheduled_on >= ?`,
    [doctorId, monthStart],
  );

  const [[pendingRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND status = 'pending'`,
    [doctorId],
  );

  return {
    today: todayRow.total,
    totalPatients: patientsRow.total,
    completedThisMonth: completedRow.total,
    pending: pendingRow.total,
  };
};

// Rendez-vous du jour d'un médecin.
const getDoctorTodayAppointments = async (doctorId, today) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.start_time, a.status, a.reason,
            u.firstname, u.lastname
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u    ON u.id = p.user_id
     WHERE a.doctor_id = ? AND a.scheduled_on = ? AND a.status != 'cancelled'
     ORDER BY a.start_time`,
    [doctorId, today],
  );

  return rows;
};

// Tous les rendez-vous d'un patient (page "Mes rendez-vous"), du plus
// récent au plus ancien : le frontend distingue à venir / passés lui-même.
const getAllByPatientId = async (patientId) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.scheduled_on, a.start_time, a.status, a.reason,
            u.firstname, u.lastname,
            CONCAT('Dr ', u.firstname, ' ', u.lastname) AS doctor_name,
            s.name AS specialty
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users u   ON u.id = d.user_id
     LEFT JOIN specialties s ON s.id = d.specialty_id
     WHERE a.patient_id = ?
     ORDER BY a.scheduled_on DESC, a.start_time DESC`,
    [patientId],
  );

  return rows;
};

// Tous les rendez-vous d'un médecin (page "Mon agenda").
const getAllByDoctorId = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.scheduled_on, a.start_time, a.status, a.reason,
            u.firstname, u.lastname
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u    ON u.id = p.user_id
     WHERE a.doctor_id = ?
     ORDER BY a.scheduled_on DESC, a.start_time DESC`,
    [doctorId],
  );

  return rows;
};

// Utilisé pour vérifier la propriété d'un rendez-vous avant annulation.
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, patient_id, doctor_id, scheduled_on, start_time, status
     FROM appointments
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

const cancel = async (id) => {
  const [result] = await pool.query(
    "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
    [id],
  );

  return result.affectedRows > 0;
};

// Patients distincts d'un médecin (page "Mes patients"), avec le nombre
// de rendez-vous et la date du dernier, du plus récent au plus ancien.
const getDistinctPatientsForDoctor = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT p.id AS patient_id, u.firstname, u.lastname, u.email, u.phone,
            COUNT(a.id) AS appointment_count,
            MAX(a.scheduled_on) AS last_appointment
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u    ON u.id = p.user_id
     WHERE a.doctor_id = ?
     GROUP BY p.id, u.firstname, u.lastname, u.email, u.phone
     ORDER BY last_appointment DESC`,
    [doctorId],
  );

  return rows;
};

module.exports = {
  create,
  findByDoctorSlot,
  reactivate,
  getPatientStats,
  getPatientAppointments,
  getDoctorStats,
  getDoctorTodayAppointments,
  getAllByPatientId,
  getAllByDoctorId,
  getDistinctPatientsForDoctor,
  findById,
  cancel,
};
