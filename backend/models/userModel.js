// backend/models/userModel.js
// Toutes les requêtes SQL touchant à la table utilisateurs.
// Aucune logique métier ici : uniquement l'accès aux données.
//
// La table est nommée en français (utilisateurs, prenom, nom,
// mot_de_passe, role ENUM('PATIENT','MEDECIN','ADMIN'), statut_compte),
// conformément à l'Annexe B du dossier de projet. Ce modèle traduit à la
// frontière : le reste du code applicatif continue de manipuler
// firstname/lastname/password_hash/role ('patient'/'doctor'/'admin')/
// is_active, exactement comme avant ce renommage.

const { pool } = require("../config/database");
const { ROLE_TO_DB, ROLE_FROM_DB, accountStatusFromDb } = require("../utils/enumMapping");

// Recherche un utilisateur par e-mail.
// Renvoie le hash du mot de passe : réservé à la connexion.
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT id, prenom AS firstname, nom AS lastname, email,
            mot_de_passe AS password_hash, role, statut_compte
     FROM utilisateurs
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    firstname: row.firstname,
    lastname: row.lastname,
    email: row.email,
    password_hash: row.password_hash,
    role: ROLE_FROM_DB[row.role],
    is_active: accountStatusFromDb(row.statut_compte),
  };
};

// Recherche par identifiant, SANS le hash du mot de passe.
// C'est cette version qu'on utilise partout ailleurs.
// La jointure avec medecins expose est_valide (is_approved) : le front
// s'en sert pour avertir un médecin dont le compte n'est pas encore validé.
// NULL pour les patients et les administrateurs, qui n'ont pas de fiche medecins.
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.prenom AS firstname, u.nom AS lastname, u.email, u.role,
            u.telephone AS phone, u.avatar AS avatar_url, u.statut_compte,
            u.date_creation AS created_at, m.est_valide AS is_approved
     FROM utilisateurs u
     LEFT JOIN medecins m ON m.utilisateur_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    firstname: row.firstname,
    lastname: row.lastname,
    email: row.email,
    role: ROLE_FROM_DB[row.role],
    phone: row.phone,
    avatar_url: row.avatar_url,
    is_active: accountStatusFromDb(row.statut_compte),
    created_at: row.created_at,
    is_approved: row.is_approved,
  };
};

// Chemin de l'avatar actuel, pour pouvoir supprimer l'ancien fichier du
// disque avant d'enregistrer le nouveau (voir authService.uploadAvatar).
const findAvatarById = async (id) => {
  const [rows] = await pool.query(
    "SELECT avatar FROM utilisateurs WHERE id = ? LIMIT 1",
    [id],
  );

  return rows[0]?.avatar || null;
};

const updateAvatar = async (id, avatarUrl) => {
  await pool.query("UPDATE utilisateurs SET avatar = ? WHERE id = ?", [
    avatarUrl,
    id,
  ]);
};

// Utilisé pour vérifier le mot de passe actuel avant de le changer.
const findPasswordHashById = async (id) => {
  const [rows] = await pool.query(
    "SELECT mot_de_passe AS password_hash FROM utilisateurs WHERE id = ? LIMIT 1",
    [id],
  );

  return rows[0] || null;
};

const updatePassword = async (id, passwordHash) => {
  await pool.query("UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?", [
    passwordHash,
    id,
  ]);
};

const emailExists = async (email) => {
  const [rows] = await pool.query(
    "SELECT id FROM utilisateurs WHERE email = ? LIMIT 1",
    [email],
  );

  return rows.length > 0;
};

// Crée l'utilisateur ET sa fiche patient ou médecin.
// Le tout dans une TRANSACTION : si la seconde insertion échoue,
// la première est annulée. Pas d'utilisateur orphelin en base.
const createWithProfile = async ({
  firstname,
  lastname,
  email,
  passwordHash,
  role,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Le contrôleur refuse déjà l'inscription sans consentement (case à
    // cocher obligatoire) : au moment où cette fonction est appelée, le
    // consentement est toujours acquis, d'où le NOW() direct.
    const [result] = await connection.query(
      `INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role, consentement_rgpd_le)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [firstname, lastname, email, passwordHash, ROLE_TO_DB[role]],
    );

    const userId = result.insertId;

    if (role === "patient") {
      await connection.query("INSERT INTO patients (utilisateur_id) VALUES (?)", [
        userId,
      ]);
    } else if (role === "doctor") {
      // est_valide reste FALSE : un administrateur doit valider le compte.
      await connection.query("INSERT INTO medecins (utilisateur_id) VALUES (?)", [
        userId,
      ]);
    }

    await connection.commit();

    return {
      id: userId,
      firstname,
      lastname,
      email,
      role,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Toutes les données personnelles brutes stockées dans utilisateurs,
// pour le droit d'accès RGPD (route d'export). Volontairement séparée de
// findById : ce n'est pas la même donnée (ici sans traduction de
// présentation), ni le même usage (fichier téléchargeable, pas affichage).
const exportAccountData = async (id) => {
  const [rows] = await pool.query(
    `SELECT prenom, nom, email, telephone, role, statut_compte,
            date_creation, consentement_rgpd_le
     FROM utilisateurs WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

// Droit à l'effacement RGPD : remplace les données personnelles
// identifiantes (nom, e-mail, mot de passe) et suspend le compte, mais ne
// supprime jamais la ligne — les rendez-vous et avis qui en dépendent
// (contraintes ON DELETE CASCADE) doivent survivre à la demande d'un
// patient ou d'un médecin, pour la continuité des dossiers concernés.
// Voir aussi patientModel.updateProfile / doctorModel.updateOwnProfile,
// appelés par le service pour effacer les champs restants (adresse...).
const anonymizeAccount = async (id, { anonymizedEmail, passwordHash }) => {
  await pool.query(
    `UPDATE utilisateurs
     SET prenom = 'Compte', nom = 'supprimé', email = ?, mot_de_passe = ?,
         statut_compte = 'SUSPENDU'
     WHERE id = ?`,
    [anonymizedEmail, passwordHash, id],
  );
};

// Suppression réelle d'un compte par un administrateur (distincte du
// droit à l'effacement RGPD ci-dessus, réservé à l'utilisateur lui-même
// sur son propre compte). Une purge administrative supprime la ligne
// utilisateurs et, par les contraintes ON DELETE CASCADE de la fiche
// patient/médecin associée, tous ses rendez-vous et avis — y compris
// ceux vus par l'autre partie (médecin ou patient). Choix assumé et
// documenté dans docs/RGPD.md : contrairement à l'auto-suppression, ce
// n'est pas une demande d'exercice d'un droit RGPD, mais une purge
// opérationnelle décidée par un administrateur.
const hardDelete = async (id) => {
  const [result] = await pool.query("DELETE FROM utilisateurs WHERE id = ?", [
    id,
  ]);

  return result.affectedRows > 0;
};

module.exports = {
  findByEmail,
  findById,
  findAvatarById,
  updateAvatar,
  findPasswordHashById,
  updatePassword,
  emailExists,
  createWithProfile,
  exportAccountData,
  anonymizeAccount,
  hardDelete,
};
