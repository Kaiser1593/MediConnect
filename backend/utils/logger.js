// backend/utils/logger.js
// Journalisation des événements de sécurité (connexions, accès refusés,
// actions sensibles de l'administrateur...) dans la table journaux_securite.
//
// Les points d'appel continuent de passer les constantes anglaises
// historiques (eventType: "LOGIN_SUCCESS"...) : c'est ce module qui
// traduit vers les valeurs françaises stockées en base, conformément à
// l'Annexe B du dossier de projet.

const { pool } = require("../config/database");
const { EVENT_TYPE_TO_DB } = require("./enumMapping");

// La journalisation ne doit jamais faire échouer la requête en cours :
// une panne d'écriture du journal n'est pas une raison de renvoyer une
// erreur à l'utilisateur. On se contente de tracer l'échec côté serveur.
// On ne journalise jamais de mot de passe, ni en clair ni haché.
const logSecurityEvent = async ({ userId, eventType, message, ipAddress, userAgent }) => {
  try {
    await pool.query(
      `INSERT INTO journaux_securite
         (utilisateur_id, type_evenement, description, adresse_ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId || null,
        EVENT_TYPE_TO_DB[eventType] || eventType,
        message,
        ipAddress || null,
        userAgent || null,
      ],
    );
  } catch (error) {
    console.error("Échec de la journalisation de sécurité :", error.message);
  }
};

module.exports = { logSecurityEvent };
