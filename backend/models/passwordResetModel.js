// backend/models/passwordResetModel.js
// Toutes les requêtes SQL touchant à la table password_resets.

const { pool } = require("../config/database");

const create = async ({ userId, tokenHash, expiresAt }) => {
  await pool.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
};

// Un jeton n'est valide que s'il n'a pas déjà été utilisé et n'est pas
// expiré : ces deux conditions sont vérifiées en base plutôt qu'en JS,
// pour éviter tout écart avec l'heure du serveur applicatif.
const findValidByTokenHash = async (tokenHash) => {
  const [rows] = await pool.query(
    `SELECT id, user_id
     FROM password_resets
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  return rows[0] || null;
};

const markUsed = async (id) => {
  await pool.query(
    "UPDATE password_resets SET used_at = NOW() WHERE id = ?",
    [id],
  );
};

module.exports = {
  create,
  findValidByTokenHash,
  markUsed,
};
