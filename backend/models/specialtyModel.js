// backend/models/specialtyModel.js
// Toutes les requêtes SQL touchant à la table specialties.

const { pool } = require("../config/database");

const getAll = async () => {
  const [rows] = await pool.query(
    "SELECT id, name, slug FROM specialties ORDER BY name",
  );

  return rows;
};

module.exports = { getAll };
