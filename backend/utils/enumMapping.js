// backend/utils/enumMapping.js
// Traduction centralisée entre les valeurs stockées en base (françaises,
// conformes à l'Annexe B du dossier) et les valeurs manipulées par le
// reste du code applicatif (anglaises, inchangées pour ne pas propager
// ce renommage à chaque contrôleur/service/composant React).
// Seuls les modèles (models/*.js) importent ce fichier.

const ROLE_TO_DB = { patient: "PATIENT", doctor: "MEDECIN", admin: "ADMIN" };
const ROLE_FROM_DB = { PATIENT: "patient", MEDECIN: "doctor", ADMIN: "admin" };

const STATUS_TO_DB = {
  pending: "EN_ATTENTE",
  confirmed: "CONFIRME",
  cancelled: "ANNULE",
  completed: "TERMINE",
};
const STATUS_FROM_DB = {
  EN_ATTENTE: "pending",
  CONFIRME: "confirmed",
  ANNULE: "cancelled",
  TERMINE: "completed",
};

const GENDER_TO_DB = { female: "FEMININ", male: "MASCULIN", other: "AUTRE" };
const GENDER_FROM_DB = { FEMININ: "female", MASCULIN: "male", AUTRE: "other" };

const accountStatusToDb = (isActive) => (isActive ? "ACTIF" : "SUSPENDU");
const accountStatusFromDb = (statutCompte) => statutCompte === "ACTIF";

// Types d'événements des journaux de sécurité (journaux_securite.type_evenement).
// Les points d'appel (authController, authMiddleware, roleMiddleware,
// adminController...) continuent de passer les constantes anglaises
// historiques à logSecurityEvent ; seuls utils/logger.js (écriture) et
// adminModel.getSecurityLogs (lecture) traduisent, via ces tables.
const EVENT_TYPE_TO_DB = {
  LOGIN_SUCCESS: "CONNEXION_REUSSIE",
  LOGIN_FAILED: "CONNEXION_ECHOUEE",
  REGISTER: "INSCRIPTION",
  PASSWORD_CHANGED: "MOT_DE_PASSE_MODIFIE",
  PASSWORD_RESET_REQUESTED: "REINITIALISATION_DEMANDEE",
  PASSWORD_RESET: "MOT_DE_PASSE_REINITIALISE",
  ACCESS_DENIED: "ACCES_REFUSE",
  DOCTOR_APPROVED: "MEDECIN_VALIDE",
  USER_STATUS_CHANGED: "SUSPENSION_COMPTE",
  // Prévu par le dossier (Phase 3) mais sans point d'appel : aucune
  // fonctionnalité de changement de rôle par un administrateur n'existe
  // dans cette version de l'application (voir database/CHANGELOG.md).
  ROLE_CHANGED: "MODIFICATION_ROLE",
};

const EVENT_TYPE_FROM_DB = Object.fromEntries(
  Object.entries(EVENT_TYPE_TO_DB).map(([english, french]) => [french, english]),
);

module.exports = {
  ROLE_TO_DB,
  ROLE_FROM_DB,
  STATUS_TO_DB,
  STATUS_FROM_DB,
  GENDER_TO_DB,
  GENDER_FROM_DB,
  accountStatusToDb,
  accountStatusFromDb,
  EVENT_TYPE_TO_DB,
  EVENT_TYPE_FROM_DB,
};
