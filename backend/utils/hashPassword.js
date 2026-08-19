// backend/utils/hashPassword.js
// Centralise le hachage des mots de passe : un seul endroit à tester,
// un seul endroit à faire évoluer si le coût bcrypt doit changer.

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = (plainPassword, hash) =>
  bcrypt.compare(plainPassword, hash);

module.exports = { hashPassword, comparePassword };
