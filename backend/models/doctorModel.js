// backend/models/doctorModel.js
// Toutes les requêtes SQL touchant à la table doctors et à l'annuaire public.
// S'appuie sur v_doctors_public : elle ne renvoie déjà que les médecins
// validés (is_approved) et dont le compte est actif.

const { pool } = require("../config/database");

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
    `SELECT * FROM v_doctors_public
     ${whereClause}
     ORDER BY full_name
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM v_doctors_public ${whereClause}`,
    params,
  );

  return { rows, total };
};

// Fiche détaillée d'un médecin : reprend v_doctors_public et y ajoute
// la biographie et l'adresse, absentes de la vue (inutiles à la recherche).
const getPublicById = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT
       d.id                AS doctor_id,
       u.firstname,
       u.lastname,
       CONCAT('Dr ', u.firstname, ' ', u.lastname) AS full_name,
       s.name              AS specialty,
       d.biography,
       d.address,
       d.city,
       d.postal_code,
       d.consultation_price,
       d.experience_years,
       d.slot_duration,
       ROUND(AVG(r.rating), 1) AS average_rating,
       COUNT(r.id)             AS review_count
     FROM doctors d
     JOIN users u        ON u.id = d.user_id
     LEFT JOIN specialties s ON s.id = d.specialty_id
     LEFT JOIN reviews r     ON r.doctor_id = d.id
     WHERE d.id = ?
       AND d.is_approved = TRUE
       AND u.is_active   = TRUE
     GROUP BY d.id, u.firstname, u.lastname, s.name, d.biography, d.address,
              d.city, d.postal_code, d.consultation_price, d.experience_years,
              d.slot_duration`,
    [doctorId],
  );

  return rows[0] || null;
};

// Résout la fiche médecin à partir de users.id (celui du token).
// Contrairement à getPublicById, ne filtre pas sur is_approved :
// un médecin doit voir son propre tableau de bord même en attente de validation.
const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, user_id, slot_duration, is_approved FROM doctors WHERE user_id = ? LIMIT 1",
    [userId],
  );

  return rows[0] || null;
};

// Horaires récurrents hebdomadaires d'un médecin.
const getWeeklyAvailabilities = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT weekday, start_time, end_time
     FROM doctor_availabilities
     WHERE doctor_id = ?
     ORDER BY weekday, start_time`,
    [doctorId],
  );

  return rows;
};

// Créneaux déjà pris pour un médecin à une date donnée.
// Un rendez-vous annulé libère le créneau.
const getBookedStartTimes = async (doctorId, scheduledOn) => {
  const [rows] = await pool.query(
    `SELECT start_time
     FROM appointments
     WHERE doctor_id = ?
       AND scheduled_on = ?
       AND status != 'cancelled'`,
    [doctorId, scheduledOn],
  );

  return rows.map((row) => row.start_time);
};

module.exports = {
  searchPublic,
  getPublicById,
  findByUserId,
  getWeeklyAvailabilities,
  getBookedStartTimes,
};
