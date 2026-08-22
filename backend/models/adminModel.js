// backend/models/adminModel.js
// Toutes les requêtes SQL réservées à l'espace administrateur.
// Aucune logique métier ici : uniquement l'accès aux données.
//
// Les tables sont nommées en français (utilisateurs, medecins,
// rendez_vous, journaux_securite...), conformément à l'Annexe B du
// dossier de projet. Ce modèle traduit à la frontière : le reste du
// code applicatif (adminController, AdminDashboard.jsx, AdminLogs.jsx...)
// continue de manipuler les mêmes noms et valeurs qu'avant ce renommage.

const { pool } = require("../config/database");
const {
  ROLE_FROM_DB,
  STATUS_TO_DB,
  STATUS_FROM_DB,
  accountStatusToDb,
  accountStatusFromDb,
  EVENT_TYPE_TO_DB,
  EVENT_TYPE_FROM_DB,
} = require("../utils/enumMapping");

const getStats = async () => {
  const [[userRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM utilisateurs",
  );

  const [[approvedDoctorRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM medecins WHERE est_valide = TRUE",
  );

  const [[pendingDoctorRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM medecins WHERE est_valide = FALSE",
  );

  const [[appointmentRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rendez_vous",
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
    `SELECT id, prenom AS firstname, nom AS lastname, email, role,
            statut_compte, date_creation AS created_at
     FROM utilisateurs
     ORDER BY date_creation DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) AS total FROM utilisateurs",
  );

  return {
    rows: rows.map(({ statut_compte: statutCompte, ...rest }) => ({
      ...rest,
      role: ROLE_FROM_DB[rest.role],
      is_active: accountStatusFromDb(statutCompte),
    })),
    total,
  };
};

const getPendingDoctors = async () => {
  const [rows] = await pool.query(
    `SELECT m.id, m.numero_rpps AS license_number, m.ville AS city,
            m.date_creation AS created_at,
            u.id AS user_id, u.prenom AS firstname, u.nom AS lastname, u.email
     FROM medecins m
     JOIN utilisateurs u ON u.id = m.utilisateur_id
     WHERE m.est_valide = FALSE
     ORDER BY m.date_creation DESC`,
  );

  return rows;
};

// Tous les médecins (validés et en attente), pour la page "Médecins".
const getAllDoctors = async ({ limit, offset }) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.numero_rpps AS license_number, m.ville AS city,
            m.est_valide AS is_approved, m.date_creation AS created_at,
            u.id AS user_id, u.prenom AS firstname, u.nom AS lastname, u.email,
            s.nom AS specialty
     FROM medecins m
     JOIN utilisateurs u ON u.id = m.utilisateur_id
     LEFT JOIN specialites s ON s.id = m.specialite_id
     ORDER BY m.date_creation DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) AS total FROM medecins",
  );

  return { rows, total };
};

// Tous les rendez-vous de la plateforme, avec patient et médecin joints.
const getAllAppointments = async ({ limit, offset, status }) => {
  const whereClause = status ? "WHERE a.statut = ?" : "";
  const params = status ? [STATUS_TO_DB[status]] : [];

  const [rows] = await pool.query(
    `SELECT a.id, a.date_rdv AS scheduled_on, a.heure_debut AS start_time, a.statut,
            pu.prenom AS patient_firstname, pu.nom AS patient_lastname,
            du.prenom AS doctor_firstname, du.nom AS doctor_lastname
     FROM rendez_vous a
     JOIN patients p ON p.id = a.patient_id
     JOIN utilisateurs pu ON pu.id = p.utilisateur_id
     JOIN medecins m  ON m.id = a.medecin_id
     JOIN utilisateurs du ON du.id = m.utilisateur_id
     ${whereClause}
     ORDER BY a.date_rdv DESC, a.heure_debut DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM rendez_vous a ${whereClause}`,
    params,
  );

  return {
    rows: rows.map(({ statut, ...rest }) => ({ ...rest, status: STATUS_FROM_DB[statut] })),
    total,
  };
};

// Répartitions utilisées par la page "Statistiques".
const getUsersByRole = async () => {
  const [rows] = await pool.query(
    "SELECT role, COUNT(*) AS total FROM utilisateurs GROUP BY role",
  );

  return rows.map((row) => ({ role: ROLE_FROM_DB[row.role], total: row.total }));
};

const getAppointmentsByStatus = async () => {
  const [rows] = await pool.query(
    "SELECT statut, COUNT(*) AS total FROM rendez_vous GROUP BY statut",
  );

  return rows.map((row) => ({ status: STATUS_FROM_DB[row.statut], total: row.total }));
};

const getDoctorsBySpecialty = async () => {
  const [rows] = await pool.query(
    `SELECT COALESCE(s.nom, 'Non renseignée') AS specialty, COUNT(*) AS total
     FROM medecins m
     LEFT JOIN specialites s ON s.id = m.specialite_id
     GROUP BY s.nom
     ORDER BY total DESC`,
  );

  return rows;
};

const approveDoctor = async (doctorId) => {
  const [result] = await pool.query(
    "UPDATE medecins SET est_valide = TRUE WHERE id = ?",
    [doctorId],
  );

  return result.affectedRows > 0;
};

const setUserActiveStatus = async (userId, isActive) => {
  const [result] = await pool.query(
    "UPDATE utilisateurs SET statut_compte = ? WHERE id = ?",
    [accountStatusToDb(isActive), userId],
  );

  return result.affectedRows > 0;
};

// Journaux de sécurité, les plus récents d'abord, avec filtre optionnel
// par type d'événement, pour la page "Journaux" de l'espace administrateur.
const getSecurityLogs = async ({ limit, offset, eventType }) => {
  const whereClause = eventType ? "WHERE l.type_evenement = ?" : "";
  const params = eventType ? [EVENT_TYPE_TO_DB[eventType] || eventType] : [];

  const [rows] = await pool.query(
    `SELECT l.id, l.type_evenement, l.description, l.adresse_ip, l.user_agent,
            l.date_evenement,
            u.id AS user_id, u.prenom AS firstname, u.nom AS lastname
     FROM journaux_securite l
     LEFT JOIN utilisateurs u ON u.id = l.utilisateur_id
     ${whereClause}
     ORDER BY l.date_evenement DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM journaux_securite l ${whereClause}`,
    params,
  );

  return {
    rows: rows.map(({ type_evenement: typeEvenement, description, adresse_ip: ipAddress, date_evenement: createdAt, ...rest }) => ({
      ...rest,
      event_type: EVENT_TYPE_FROM_DB[typeEvenement] || typeEvenement,
      message: description,
      ip_address: ipAddress,
      created_at: createdAt,
    })),
    total,
  };
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
