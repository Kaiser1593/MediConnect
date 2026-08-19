// backend/models/notificationModel.js
// Toutes les requêtes SQL touchant à la table notifications.

const { pool } = require("../config/database");

const create = async ({ userId, type, title, message }) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES (?, ?, ?, ?)`,
    [userId, type, title, message],
  );

  return result.insertId;
};

const getByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, type, title, message, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows;
};

// La condition sur user_id garantit qu'un utilisateur ne peut marquer
// comme lue qu'une notification qui lui appartient.
const markAsRead = async (id, userId) => {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [id, userId],
  );

  return result.affectedRows > 0;
};

module.exports = { create, getByUserId, markAsRead };
