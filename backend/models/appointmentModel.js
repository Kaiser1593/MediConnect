// backend/models/appointmentModel.js
// Toutes les requêtes SQL touchant à la table rendez_vous.
//
// La table est nommée en français (rendez_vous, medecin_id, date_rdv,
// heure_debut, heure_fin, statut ENUM('EN_ATTENTE','CONFIRME','ANNULE',
// 'TERMINE'), motif, notes_medecin), conformément à l'Annexe B du
// dossier de projet. Ce modèle traduit à la frontière : le reste du
// code applicatif continue de manipuler les mêmes noms et les mêmes
// valeurs de statut ('pending'/'confirmed'/'cancelled'/'completed')
// qu'avant ce renommage.

const { pool } = require("../config/database");
const { STATUS_TO_DB, STATUS_FROM_DB } = require("../utils/enumMapping");

const create = async ({
  patientId,
  doctorId,
  scheduledOn,
  startTime,
  endTime,
  reason,
}) => {
  const [result] = await pool.query(
    `INSERT INTO rendez_vous
       (patient_id, medecin_id, date_rdv, heure_debut, heure_fin, motif)
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

// La contrainte UNIQUE (medecin_id, date_rdv, heure_debut) porte sur le
// créneau, pas sur son statut : un rendez-vous annulé occupe donc toujours
// la ligne. Avant de réserver, on vérifie s'il en existe déjà une pour ce
// créneau (annulée ou non) afin de la réactiver plutôt que d'entrer en
// conflit avec elle.
const findByDoctorSlot = async (doctorId, scheduledOn, startTime) => {
  const [rows] = await pool.query(
    `SELECT id, statut
     FROM rendez_vous
     WHERE medecin_id = ? AND date_rdv = ? AND heure_debut = ?
     LIMIT 1`,
    [doctorId, scheduledOn, startTime],
  );

  const row = rows[0];
  if (!row) return null;

  return { id: row.id, status: STATUS_FROM_DB[row.statut] };
};

// Réutilise une ligne annulée pour une nouvelle réservation, plutôt que
// d'insérer un doublon qui violerait la contrainte UNIQUE du créneau.
const reactivate = async (id, { patientId, endTime, reason }) => {
  await pool.query(
    `UPDATE rendez_vous
     SET patient_id = ?, heure_fin = ?, motif = ?, statut = ?, notes_medecin = NULL
     WHERE id = ?`,
    [patientId, endTime, reason || null, STATUS_TO_DB.pending, id],
  );

  return { id, patientId, endTime, reason: reason || null, status: "pending" };
};

// Statistiques du tableau de bord patient. "today" est fourni par l'appelant
// (calculé côté service) plutôt que CURDATE(), pour rester cohérent avec la
// date utilisée par le calcul des créneaux, qui ne dépend pas du fuseau
// horaire du serveur MySQL.
const getPatientStats = async (patientId, today) => {
  const [[upcomingRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE patient_id = ? AND statut IN (?, ?)
       AND date_rdv >= ?`,
    [patientId, STATUS_TO_DB.pending, STATUS_TO_DB.confirmed, today],
  );

  const [[completedRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE patient_id = ? AND statut = ?`,
    [patientId, STATUS_TO_DB.completed],
  );

  const [[cancelledRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE patient_id = ? AND statut = ?`,
    [patientId, STATUS_TO_DB.cancelled],
  );

  const [[totalRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rendez_vous WHERE patient_id = ?",
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
    `SELECT a.id, a.date_rdv AS scheduled_on, a.heure_debut AS start_time, a.statut,
            u.prenom AS firstname, u.nom AS lastname, u.avatar AS avatar_url,
            CONCAT('Dr ', u.prenom, ' ', u.nom) AS doctor_name,
            s.nom AS specialty
     FROM rendez_vous a
     JOIN medecins m ON m.id = a.medecin_id
     JOIN utilisateurs u ON u.id = m.utilisateur_id
     LEFT JOIN specialites s ON s.id = m.specialite_id
     WHERE a.patient_id = ?
       AND a.statut IN (?, ?)
       AND a.date_rdv >= ?
     ORDER BY a.date_rdv, a.heure_debut
     LIMIT ?`,
    [patientId, STATUS_TO_DB.pending, STATUS_TO_DB.confirmed, today, limit],
  );

  return rows.map(({ statut, ...rest }) => ({ ...rest, status: STATUS_FROM_DB[statut] }));
};

// Statistiques du tableau de bord médecin.
const getDoctorStats = async (doctorId, today) => {
  const [[todayRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE medecin_id = ? AND date_rdv = ? AND statut != ?`,
    [doctorId, today, STATUS_TO_DB.cancelled],
  );

  const [[patientsRow]] = await pool.query(
    "SELECT COUNT(DISTINCT patient_id) AS total FROM rendez_vous WHERE medecin_id = ?",
    [doctorId],
  );

  const monthStart = `${today.slice(0, 7)}-01`;

  const [[completedRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE medecin_id = ? AND statut = ? AND date_rdv >= ?`,
    [doctorId, STATUS_TO_DB.completed, monthStart],
  );

  const [[pendingRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous
     WHERE medecin_id = ? AND statut = ?`,
    [doctorId, STATUS_TO_DB.pending],
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
    `SELECT a.id, a.heure_debut AS start_time, a.statut, a.motif AS reason,
            u.prenom AS firstname, u.nom AS lastname, u.avatar AS avatar_url
     FROM rendez_vous a
     JOIN patients p ON p.id = a.patient_id
     JOIN utilisateurs u ON u.id = p.utilisateur_id
     WHERE a.medecin_id = ? AND a.date_rdv = ? AND a.statut != ?
     ORDER BY a.heure_debut`,
    [doctorId, today, STATUS_TO_DB.cancelled],
  );

  return rows.map(({ statut, ...rest }) => ({ ...rest, status: STATUS_FROM_DB[statut] }));
};

// Tous les rendez-vous d'un patient (page "Mes rendez-vous"), du plus
// récent au plus ancien : le frontend distingue à venir / passés lui-même.
// doctor_id sert à replanifier (lien vers la page de réservation), review_id
// à savoir si un avis a déjà été laissé sur un rendez-vous terminé.
const getAllByPatientId = async (patientId) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.date_rdv AS scheduled_on, a.heure_debut AS start_time,
            a.statut, a.motif AS reason, a.medecin_id AS doctor_id,
            u.prenom AS firstname, u.nom AS lastname, u.avatar AS avatar_url,
            CONCAT('Dr ', u.prenom, ' ', u.nom) AS doctor_name,
            s.nom AS specialty,
            av.id AS review_id, av.note AS review_rating
     FROM rendez_vous a
     JOIN medecins m ON m.id = a.medecin_id
     JOIN utilisateurs u ON u.id = m.utilisateur_id
     LEFT JOIN specialites s ON s.id = m.specialite_id
     LEFT JOIN avis av ON av.rendez_vous_id = a.id
     WHERE a.patient_id = ?
     ORDER BY a.date_rdv DESC, a.heure_debut DESC`,
    [patientId],
  );

  return rows.map(({ statut, ...rest }) => ({ ...rest, status: STATUS_FROM_DB[statut] }));
};

// Tous les rendez-vous d'un médecin (page "Mon agenda").
const getAllByDoctorId = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.date_rdv AS scheduled_on, a.heure_debut AS start_time,
            a.statut, a.motif AS reason,
            u.prenom AS firstname, u.nom AS lastname, u.avatar AS avatar_url
     FROM rendez_vous a
     JOIN patients p ON p.id = a.patient_id
     JOIN utilisateurs u ON u.id = p.utilisateur_id
     WHERE a.medecin_id = ?
     ORDER BY a.date_rdv DESC, a.heure_debut DESC`,
    [doctorId],
  );

  return rows.map(({ statut, ...rest }) => ({ ...rest, status: STATUS_FROM_DB[statut] }));
};

// Utilisé pour vérifier la propriété d'un rendez-vous avant annulation.
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, patient_id, medecin_id AS doctor_id, date_rdv AS scheduled_on,
            heure_debut AS start_time, statut
     FROM rendez_vous
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  const { statut, ...rest } = row;
  return { ...rest, status: STATUS_FROM_DB[statut] };
};

const cancel = async (id) => {
  const [result] = await pool.query(
    "UPDATE rendez_vous SET statut = ? WHERE id = ?",
    [STATUS_TO_DB.cancelled, id],
  );

  return result.affectedRows > 0;
};

const confirm = async (id) => {
  const [result] = await pool.query(
    "UPDATE rendez_vous SET statut = ? WHERE id = ?",
    [STATUS_TO_DB.confirmed, id],
  );

  return result.affectedRows > 0;
};

// notes_medecin n'est jamais exposé au patient : c'est le compte rendu
// interne du médecin, réservé à son propre usage.
const complete = async (id, doctorNotes) => {
  const [result] = await pool.query(
    "UPDATE rendez_vous SET statut = ?, notes_medecin = ? WHERE id = ?",
    [STATUS_TO_DB.completed, doctorNotes || null, id],
  );

  return result.affectedRows > 0;
};

// Patients distincts d'un médecin (page "Mes patients"), avec le nombre
// de rendez-vous et la date du dernier, du plus récent au plus ancien.
const getDistinctPatientsForDoctor = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT p.id AS patient_id, u.prenom AS firstname, u.nom AS lastname,
            u.email, u.telephone AS phone,
            COUNT(a.id) AS appointment_count,
            MAX(a.date_rdv) AS last_appointment
     FROM rendez_vous a
     JOIN patients p ON p.id = a.patient_id
     JOIN utilisateurs u ON u.id = p.utilisateur_id
     WHERE a.medecin_id = ?
     GROUP BY p.id, u.prenom, u.nom, u.email, u.telephone
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
  confirm,
  complete,
};
