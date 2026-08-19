// backend/services/authService.js
// Logique métier de l'authentification : le contrôleur ne garde que la
// validation du format des champs et la construction de la réponse HTTP.

const userModel = require("../models/userModel");
const { generateToken } = require("../utils/generateToken");
const { logSecurityEvent } = require("../utils/logger");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

// Les rôles qu'un visiteur peut choisir librement à l'inscription.
// "admin" en est volontairement absent : un compte administrateur ne se
// crée jamais via le formulaire public.
const PUBLIC_ROLES = ["patient", "doctor"];

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const register = async ({ firstname, lastname, email, role, password, ipAddress }) => {
  if (!PUBLIC_ROLES.includes(role)) {
    throw makeError("Le type de compte sélectionné est invalide.", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (await userModel.emailExists(normalizedEmail)) {
    throw makeError("Un compte existe déjà avec cette adresse e-mail.", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await userModel.createWithProfile({
    firstname: firstname.trim(),
    lastname: lastname.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
  });

  const token = generateToken(user);

  logSecurityEvent({
    userId: user.id,
    eventType: "REGISTER",
    message: `Création de compte (${role}).`,
    ipAddress,
  });

  return { user, token };
};

// Message volontairement identique que l'e-mail existe ou non, ou que le
// mot de passe soit erroné : sinon la réponse permettrait de deviner
// quels comptes existent.
const login = async ({ email, password, ipAddress }) => {
  const invalidCredentials = () =>
    makeError("Adresse e-mail ou mot de passe incorrect.", 401);

  const user = await userModel.findByEmail(email.trim().toLowerCase());

  if (!user) {
    logSecurityEvent({
      userId: null,
      eventType: "LOGIN_FAILED",
      message: "Tentative de connexion avec une adresse e-mail inconnue.",
      ipAddress,
    });

    throw invalidCredentials();
  }

  const passwordMatches = await comparePassword(password, user.password_hash);

  if (!passwordMatches) {
    logSecurityEvent({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      message: "Mot de passe incorrect.",
      ipAddress,
    });

    throw invalidCredentials();
  }

  if (!user.is_active) {
    logSecurityEvent({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      message: "Tentative de connexion sur un compte désactivé.",
      ipAddress,
    });

    throw makeError(
      "Ce compte a été désactivé. Contactez l'administration.",
      403,
    );
  }

  const token = generateToken(user);

  logSecurityEvent({
    userId: user.id,
    eventType: "LOGIN_SUCCESS",
    message: "Connexion réussie.",
    ipAddress,
  });

  return {
    token,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    },
  };
};

const changePassword = async ({ userId, currentPassword, newPassword, ipAddress }) => {
  const record = await userModel.findPasswordHashById(userId);

  const currentMatches = await comparePassword(
    currentPassword,
    record.password_hash,
  );

  if (!currentMatches) {
    throw makeError("Le mot de passe actuel est incorrect.", 401);
  }

  const newPasswordHash = await hashPassword(newPassword);
  await userModel.updatePassword(userId, newPasswordHash);

  logSecurityEvent({
    userId,
    eventType: "PASSWORD_CHANGED",
    message: "Mot de passe modifié par l'utilisateur.",
    ipAddress,
  });
};

module.exports = { register, login, changePassword };
