// backend/models/doctorModel.js
// Toutes les requêtes SQL touchant à la table medecins et à l'annuaire
// public. S'appuie sur v_medecins_public : elle ne renvoie déjà que les
// médecins validés (est_valide) et dont le compte est actif.
//
// La table et la vue sont nommées en français (medecins, utilisateur_id,
// specialite_id, numero_rpps, biographie, duree_creneau, est_valide...),
// conformément à l'Annexe B du dossier de projet. La vue expose déjà ses
// colonnes sous les noms anglais historiques (doctor_id, firstname...) :
// c'est elle qui sert de frontière de traduction pour searchPublic et
// getPublicById. Les autres méthodes traduisent directement ici.

const { pool } = require("../config/database");
const { STATUS_TO_DB } = require("../utils/enumMapping");

// Recherche dans l'annuaire public, avec filtres optionnels.
const searchPublic = async ({ specialty, city, search, limit, offset }) => {
  const conditions = [];
  const params = [];

  if (specialty) {
    conditions.push("specialty = ?");
    params.push(specialty);
  }

  if (city) {
    conditions.push("city LIKE ?");
    params.push(`%${city}%`);
  }

  if (search) {
    conditions.push("full_name LIKE ?");
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const [rows] = await pool.query(
    `SELECT * FROM v_medecins_public
     ${whereClause}
     ORDER BY full_name
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM v_medecins_public ${whereClause}`,
    params,
  );

  return { rows, total };
};

// Fiche détaillée d'un médecin : reprend v_medecins_public et y ajoute
// la biographie et l'adresse, absentes de la vue (inutiles à la recherche).
const getPublicById = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT
       m.id                AS doctor_id,
       u.prenom            AS firstname,
       u.nom               AS lastname,
       CONCAT('Dr ', u.prenom, ' ', u.nom) AS full_name,
       u.avatar            AS avatar_url,
       s.nom               AS specialty,
       m.biographie        AS biography,
       m.adresse           AS address,
       m.ville             AS city,
       m.code_postal       AS postal_code,
       m.prix_consultation AS consultation_price,
       m.annees_experience AS experience_years,
       m.duree_creneau     AS slot_duration,
       ROUND(AVG(a.note), 1) AS average_rating,
       COUNT(a.id)            AS review_count
     FROM medecins m
     JOIN utilisateurs u        ON u.id = m.utilisateur_id
     LEFT JOIN specialites s ON s.id = m.specialite_id
     LEFT JOIN avis a        ON a.medecin_id = m.id
     WHERE m.id = ?
       AND m.est_valide     = TRUE
       AND u.statut_compte  = 'ACTIF'
     GROUP BY m.id, u.prenom, u.nom, u.avatar, s.nom, m.biographie, m.adresse,
              m.ville, m.code_postal, m.prix_consultation, m.annees_experience,
              m.duree_creneau`,
    [doctorId],
  );

  return rows[0] || null;
};

// Résout la fiche médecin à partir de utilisateurs.id (celui du token).
// Contrairement à getPublicById, ne filtre pas sur est_valide :
// un médecin doit voir son propre tableau de bord même en attente de validation.
const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, utilisateur_id AS user_id, duree_creneau AS slot_duration,
            est_valide AS is_approved, specialite_id AS specialty_id
     FROM medecins WHERE utilisateur_id = ? LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

// Profil complet du médecin connecté, pour la page "Mon profil".
// Contrairement à getPublicById, inclut specialite_id (utile pour
// pré-remplir le <select>) et ne filtre pas sur est_valide.
const getOwnProfile = async (userId) => {
  const [rows] = await pool.query(
    `SELECT m.id, u.prenom AS firstname, u.nom AS lastname, u.email,
            u.telephone AS phone,
            m.specialite_id AS specialty_id, m.numero_rpps AS license_number,
            m.biographie AS biography, m.adresse AS address,
            m.ville AS city, m.code_postal AS postal_code,
            m.prix_consultation AS consultation_price,
            m.annees_experience AS experience_years,
            m.duree_creneau AS slot_duration, m.est_valide AS is_approved
     FROM medecins m
     JOIN utilisateurs u ON u.id = m.utilisateur_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

// Met à jour le compte (utilisateurs) et la fiche médecin (medecins) ensemble.
const updateOwnProfile = async (
  userId,
  {
    firstname,
    lastname,
    phone,
    specialtyId,
    licenseNumber,
    biography,
    address,
    city,
    postalCode,
    consultationPrice,
    experienceYears,
  },
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE utilisateurs SET prenom = ?, nom = ?, telephone = ? WHERE id = ?",
      [firstname, lastname, phone || null, userId],
    );

    await connection.query(
      `UPDATE medecins
       SET specialite_id = ?, numero_rpps = ?, biographie = ?, adresse = ?,
           ville = ?, code_postal = ?, prix_consultation = ?, annees_experience = ?
       WHERE utilisateur_id = ?`,
      [
        specialtyId || null,
        licenseNumber || null,
        biography || null,
        address || null,
        city || null,
        postalCode || null,
        consultationPrice || null,
        experienceYears || null,
        userId,
      ],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Horaires récurrents hebdomadaires d'un médecin.
const getWeeklyAvailabilities = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT id, jour_semaine AS weekday, heure_debut AS start_time,
            heure_fin AS end_time
     FROM disponibilites
     WHERE medecin_id = ?
     ORDER BY jour_semaine, heure_debut`,
    [doctorId],
  );

  return rows;
};

const addAvailability = async (doctorId, { weekday, startTime, endTime }) => {
  const [result] = await pool.query(
    `INSERT INTO disponibilites (medecin_id, jour_semaine, heure_debut, heure_fin)
     VALUES (?, ?, ?, ?)`,
    [doctorId, weekday, startTime, endTime],
  );

  return { id: result.insertId, weekday, startTime, endTime };
};

// La condition sur medecin_id garantit qu'un médecin ne peut supprimer
// qu'un créneau qui lui appartient.
const deleteAvailability = async (id, doctorId) => {
  const [result] = await pool.query(
    "DELETE FROM disponibilites WHERE id = ? AND medecin_id = ?",
    [id, doctorId],
  );

  return result.affectedRows > 0;
};

// Créneaux déjà pris pour un médecin à une date donnée.
// Un rendez-vous annulé libère le créneau.
const getBookedStartTimes = async (doctorId, scheduledOn) => {
  const [rows] = await pool.query(
    `SELECT heure_debut
     FROM rendez_vous
     WHERE medecin_id = ?
       AND date_rdv = ?
       AND statut != ?`,
    [doctorId, scheduledOn, STATUS_TO_DB.cancelled],
  );

  return rows.map((row) => row.heure_debut);
};

// Résout utilisateurs.id à partir de medecins.id, pour notifier le bon compte.
const getUserIdById = async (doctorId) => {
  const [rows] = await pool.query(
    "SELECT utilisateur_id FROM medecins WHERE id = ? LIMIT 1",
    [doctorId],
  );

  return rows[0] ? rows[0].utilisateur_id : null;
};

// Retire le médecin des résultats de recherche publics, sans supprimer sa
// fiche : appelée lors d'une demande de suppression de compte (droit à
// l'effacement RGPD), pour que ses rendez-vous passés restent rattachés à
// un médecin identifiable dans l'historique, sans rester visible à de
// nouveaux patients.
const revokeValidation = async (userId) => {
  await pool.query(
    "UPDATE medecins SET est_valide = FALSE WHERE utilisateur_id = ?",
    [userId],
  );
};

module.exports = {
  searchPublic,
  revokeValidation,
  getPublicById,
  findByUserId,
  getUserIdById,
  getOwnProfile,
  updateOwnProfile,
  getWeeklyAvailabilities,
  addAvailability,
  deleteAvailability,
  getBookedStartTimes,
};
