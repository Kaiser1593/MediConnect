// backend/config/database.js
// Pool de connexions MySQL partagé par toute l'application.

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
  charset: "utf8mb4",
});

// Vérifie au démarrage que la base est bien joignable.
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("Connexion à la base de données MySQL établie.");
  } catch (error) {
    console.error("Impossible de se connecter à MySQL :", error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };