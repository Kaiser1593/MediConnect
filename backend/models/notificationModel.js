// backend/models/notificationModel.js
// Toutes les requêtes SQL touchant à la table notifications.

const { pool } = require("../config/database");

const create = async ({ userId, appointmentId, type, title, message }) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (utilisateur_id, rendez_vous_id, type, titre, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, appointmentId || null, type, title, message],
  );

  return result.insertId;
};

const getByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, type, titre AS title, message, lue AS is_read, date_envoi AS created_at
     FROM notifications
     WHERE utilisateur_id = ?
     ORDER BY date_envoi DESC`,
    [userId],
  );

  return rows;
};

// La condition sur utilisateur_id garantit qu'un utilisateur ne peut
// marquer comme lue qu'une notification qui lui appartient.
const markAsRead = async (id, userId) => {
  const [result] = await pool.query(
    "UPDATE notifications SET lue = TRUE WHERE id = ? AND utilisateur_id = ?",
    [id, userId],
  );

  return result.affectedRows > 0;
};

module.exports = { create, getByUserId, markAsRead };
