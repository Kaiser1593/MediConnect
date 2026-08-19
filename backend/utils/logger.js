// backend/utils/logger.js
// Journalisation des événements de sécurité (connexions, accès refusés,
// actions sensibles de l'administrateur...) dans la table security_logs.

const { pool } = require("../config/database");

// La journalisation ne doit jamais faire échouer la requête en cours :
// une panne d'écriture du journal n'est pas une raison de renvoyer une
// erreur à l'utilisateur. On se contente de tracer l'échec côté serveur.
// On ne journalise jamais de mot de passe, ni en clair ni haché.
const logSecurityEvent = async ({ userId, eventType, message, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO security_logs (user_id, event_type, message, ip_address)
       VALUES (?, ?, ?, ?)`,
      [userId || null, eventType, message, ipAddress || null],
    );
  } catch (error) {
    console.error("Échec de la journalisation de sécurité :", error.message);
  }
};

module.exports = { logSecurityEvent };
