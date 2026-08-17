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

module.exports = { findByUserId };
