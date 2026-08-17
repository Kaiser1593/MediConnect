// backend/models/userModel.js
// Toutes les requêtes SQL touchant à la table users.
// Aucune logique métier ici : uniquement l'accès aux données.

const { pool } = require("../config/database");

// Recherche un utilisateur par e-mail.
// Renvoie le hash du mot de passe : réservé à la connexion.
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT id, firstname, lastname, email, password_hash, role, is_active
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

// Recherche par identifiant, SANS le hash du mot de passe.
// C'est cette version qu'on utilise partout ailleurs.
// La jointure avec doctors expose is_approved : le front s'en sert
// pour avertir un médecin dont le compte n'est pas encore validé.
// NULL pour les patients et les administrateurs, qui n'ont pas de fiche doctors.
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.firstname, u.lastname, u.email, u.role, u.phone,
            u.is_active, u.created_at, d.is_approved
     FROM users u
     LEFT JOIN doctors d ON d.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

const emailExists = async (email) => {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
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

    const [result] = await connection.query(
      `INSERT INTO users (firstname, lastname, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [firstname, lastname, email, passwordHash, role],
    );

    const userId = result.insertId;

    if (role === "patient") {
      await connection.query("INSERT INTO patients (user_id) VALUES (?)", [
        userId,
      ]);
    } else if (role === "doctor") {
      // is_approved reste FALSE : un administrateur doit valider le compte.
      await connection.query("INSERT INTO doctors (user_id) VALUES (?)", [
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

module.exports = {
  findByEmail,
  findById,
  emailExists,
  createWithProfile,
};