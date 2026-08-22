// backend/models/passwordResetModel.js
// Toutes les requêtes SQL touchant à la table reinitialisations_mot_de_passe.

const { pool } = require("../config/database");

const create = async ({ userId, tokenHash, expiresAt }) => {
  await pool.query(
    `INSERT INTO reinitialisations_mot_de_passe (utilisateur_id, jeton_hache, expire_le)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
};

// Un jeton n'est valide que s'il n'a pas déjà été utilisé et n'est pas
// expiré : ces deux conditions sont vérifiées en base plutôt qu'en JS,
// pour éviter tout écart avec l'heure du serveur applicatif.
const findValidByTokenHash = async (tokenHash) => {
  const [rows] = await pool.query(
    `SELECT id, utilisateur_id AS user_id
     FROM reinitialisations_mot_de_passe
     WHERE jeton_hache = ? AND utilise_le IS NULL AND expire_le > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  return rows[0] || null;
};

const markUsed = async (id) => {
  await pool.query(
    "UPDATE reinitialisations_mot_de_passe SET utilise_le = NOW() WHERE id = ?",
    [id],
  );
};

module.exports = {
  create,
  findValidByTokenHash,
  markUsed,
};
