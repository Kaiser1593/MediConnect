// backend/utils/validators.js
// Fonctions de validation de format, réutilisées par validationMiddleware.js
// et testables indépendamment de toute requête HTTP.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;
const VALID_ROLES = ["patient", "doctor", "admin"];

const isValidEmail = (value) =>
  typeof value === "string" && EMAIL_PATTERN.test(value);

const isValidPassword = (value) =>
  typeof value === "string" && value.length >= 8;

const isValidRole = (value) => VALID_ROLES.includes(value);

const isValidDate = (value) =>
  typeof value === "string" && DATE_PATTERN.test(value);

const isValidTime = (value) =>
  typeof value === "string" && TIME_PATTERN.test(value);

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidDate,
  isValidTime,
};
