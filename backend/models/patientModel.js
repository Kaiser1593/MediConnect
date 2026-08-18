// backend/models/patientModel.js
// Toutes les requêtes SQL touchant à la table patients.

const { pool } = require("../config/database");

// Résout la fiche patient à partir de l'identifiant users.id (celui du token).
const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, user_id FROM patients WHERE user_id = ? LIMIT 1",
    [userId],
  );

  return rows[0] || null;
};

// Profil complet, pour la page "Mon profil" : infos de compte (users)
// et infos patient (patients) réunies dans une seule ligne.
const getProfileByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.firstname, u.lastname, u.email, u.phone,
            p.birth_date, p.gender, p.address, p.city, p.postal_code
     FROM users u
     JOIN patients p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

// Met à jour le compte (users) et la fiche patient (patients) ensemble,
// dans une transaction : les deux tables restent cohérentes ou aucune
// des deux n'est modifiée.
const updateProfile = async (
  userId,
  { firstname, lastname, phone, birthDate, gender, address, city, postalCode },
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE users SET firstname = ?, lastname = ?, phone = ? WHERE id = ?",
      [firstname, lastname, phone || null, userId],
    );

    await connection.query(
      `UPDATE patients
       SET birth_date = ?, gender = ?, address = ?, city = ?, postal_code = ?
       WHERE user_id = ?`,
      [birthDate || null, gender || null, address || null, city || null, postalCode || null, userId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { findByUserId, getProfileByUserId, updateProfile };
