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

// Profil complet du médecin connecté, pour la page "Mon profil".
// Contrairement à getPublicById, inclut specialty_id (utile pour
// pré-remplir le <select>) et ne filtre pas sur is_approved.
const getOwnProfile = async (userId) => {
  const [rows] = await pool.query(
    `SELECT d.id, u.firstname, u.lastname, u.email, u.phone,
            d.specialty_id, d.license_number, d.biography, d.address,
            d.city, d.postal_code, d.consultation_price, d.experience_years,
            d.slot_duration, d.is_approved
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

// Met à jour le compte (users) et la fiche médecin (doctors) ensemble.
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
      "UPDATE users SET firstname = ?, lastname = ?, phone = ? WHERE id = ?",
      [firstname, lastname, phone || null, userId],
    );

    await connection.query(
      `UPDATE doctors
       SET specialty_id = ?, license_number = ?, biography = ?, address = ?,
           city = ?, postal_code = ?, consultation_price = ?, experience_years = ?
       WHERE user_id = ?`,
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
    `SELECT id, weekday, start_time, end_time
     FROM doctor_availabilities
     WHERE doctor_id = ?
     ORDER BY weekday, start_time`,
    [doctorId],
  );

  return rows;
};

const addAvailability = async (doctorId, { weekday, startTime, endTime }) => {
  const [result] = await pool.query(
    `INSERT INTO doctor_availabilities (doctor_id, weekday, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [doctorId, weekday, startTime, endTime],
  );

  return { id: result.insertId, weekday, startTime, endTime };
};

// La condition sur doctor_id garantit qu'un médecin ne peut supprimer
// qu'un créneau qui lui appartient.
const deleteAvailability = async (id, doctorId) => {
  const [result] = await pool.query(
    "DELETE FROM doctor_availabilities WHERE id = ? AND doctor_id = ?",
    [id, doctorId],
  );

  return result.affectedRows > 0;
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
  getOwnProfile,
  updateOwnProfile,
  getWeeklyAvailabilities,
  addAvailability,
  deleteAvailability,
  getBookedStartTimes,
};
