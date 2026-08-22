// backend/models/patientModel.js
// Toutes les requêtes SQL touchant à la table patients (colonnes en
// français : utilisateur_id, date_naissance, genre, adresse, ville,
// code_postal). Ce modèle traduit à la frontière : le reste du code
// applicatif continue de manipuler les mêmes noms qu'avant ce renommage.

const { pool } = require("../config/database");
const { GENDER_TO_DB, GENDER_FROM_DB } = require("../utils/enumMapping");

// Résout la fiche patient à partir de l'identifiant utilisateurs.id (celui du token).
const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, utilisateur_id AS user_id FROM patients WHERE utilisateur_id = ? LIMIT 1",
    [userId],
  );

  return rows[0] || null;
};

// Profil complet, pour la page "Mon profil" : infos de compte (utilisateurs)
// et infos patient (patients) réunies dans une seule ligne.
const getProfileByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.prenom AS firstname, u.nom AS lastname, u.email,
            u.telephone AS phone,
            p.date_naissance AS birth_date, p.genre, p.adresse AS address,
            p.ville AS city, p.code_postal AS postal_code
     FROM utilisateurs u
     JOIN patients p ON p.utilisateur_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  const row = rows[0];
  if (!row) return null;

  const { genre, ...rest } = row;
  return { ...rest, gender: genre ? GENDER_FROM_DB[genre] : null };
};

// Met à jour le compte (utilisateurs) et la fiche patient (patients)
// ensemble, dans une transaction : les deux tables restent cohérentes
// ou aucune des deux n'est modifiée.
const updateProfile = async (
  userId,
  { firstname, lastname, phone, birthDate, gender, address, city, postalCode },
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE utilisateurs SET prenom = ?, nom = ?, telephone = ? WHERE id = ?",
      [firstname, lastname, phone || null, userId],
    );

    await connection.query(
      `UPDATE patients
       SET date_naissance = ?, genre = ?, adresse = ?, ville = ?, code_postal = ?
       WHERE utilisateur_id = ?`,
      [
        birthDate || null,
        gender ? GENDER_TO_DB[gender] : null,
        address || null,
        city || null,
        postalCode || null,
        userId,
      ],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Résout utilisateurs.id à partir de patients.id, pour notifier le bon compte.
const getUserIdById = async (patientId) => {
  const [rows] = await pool.query(
    "SELECT utilisateur_id FROM patients WHERE id = ? LIMIT 1",
    [patientId],
  );

  return rows[0] ? rows[0].utilisateur_id : null;
};

module.exports = {
  findByUserId,
  getProfileByUserId,
  updateProfile,
  getUserIdById,
};
