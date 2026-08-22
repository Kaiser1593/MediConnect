// backend/models/specialtyModel.js
// Toutes les requêtes SQL touchant à la table specialites.

const { pool } = require("../config/database");

const getAll = async () => {
  const [rows] = await pool.query(
    "SELECT id, nom AS name, slug FROM specialites ORDER BY nom",
  );

  return rows;
};

module.exports = { getAll };
