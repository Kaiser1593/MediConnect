// backend/scripts/createAdmin.js
// Crée un compte administrateur, ou promeut un compte existant.
// L'inscription publique refuse volontairement le rôle "admin" :
// c'est ce script qui sert de porte d'entrée pour ce rôle.
//
// Usage :
//   node scripts/createAdmin.js <email> <motdepasse> [prenom] [nom]

require("dotenv").config();

const bcrypt = require("bcrypt");

const { pool } = require("../config/database");

const SALT_ROUNDS = 12;

const run = async () => {
  const [email, password, firstname = "Admin", lastname = "MediConnect"] =
    process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Usage : node scripts/createAdmin.js <email> <motdepasse> [prenom] [nom]",
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [existingRows] = await pool.query(
    "SELECT id, role FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail],
  );

  const existing = existingRows[0];

  if (existing) {
    await pool.query(
      `UPDATE users
       SET role = 'admin', password_hash = ?, firstname = ?, lastname = ?
       WHERE id = ?`,
      [passwordHash, firstname.trim(), lastname.trim(), existing.id],
    );

    console.log(
      existing.role === "admin"
        ? `Compte administrateur mis à jour : ${normalizedEmail}`
        : `Compte existant promu administrateur : ${normalizedEmail}`,
    );

    return;
  }

  await pool.query(
    `INSERT INTO users (firstname, lastname, email, password_hash, role)
     VALUES (?, ?, ?, ?, 'admin')`,
    [firstname.trim(), lastname.trim(), normalizedEmail, passwordHash],
  );

  console.log(`Compte administrateur créé : ${normalizedEmail}`);
};

run()
  .catch((error) => {
    console.error("Échec de la création du compte administrateur :", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
