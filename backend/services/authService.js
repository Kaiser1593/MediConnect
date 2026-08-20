// backend/services/authService.js
// Logique métier de l'authentification : le contrôleur ne garde que la
// validation du format des champs et la construction de la réponse HTTP.

const crypto = require("crypto");

const userModel = require("../models/userModel");
const passwordResetModel = require("../models/passwordResetModel");
const { generateToken } = require("../utils/generateToken");
const { logSecurityEvent } = require("../utils/logger");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const emailService = require("./emailService");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

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

// Message identique et succès renvoyé au contrôleur que l'adresse existe
// ou non : révéler la différence permettrait de deviner quels e-mails
// sont inscrits. L'échec d'envoi du mail (SMTP en panne, par exemple)
// n'est jamais remonté au client pour la même raison ; il est seulement
// tracé côté serveur.
const requestPasswordReset = async ({ email, ipAddress }) => {
  const user = await userModel.findByEmail(email.trim().toLowerCase());

  if (!user) {
    logSecurityEvent({
      userId: null,
      eventType: "PASSWORD_RESET_REQUESTED",
      message: "Demande de réinitialisation sur une adresse e-mail inconnue.",
      ipAddress,
    });

    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await passwordResetModel.create({ userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${process.env.FRONTEND_URL}/reinitialisation/${token}`;

  try {
    await emailService.sendPasswordResetEmail({
      to: user.email,
      firstname: user.firstname,
      resetUrl,
    });
  } catch (error) {
    console.error("Échec de l'envoi de l'e-mail de réinitialisation :", error.message);
  }

  logSecurityEvent({
    userId: user.id,
    eventType: "PASSWORD_RESET_REQUESTED",
    message: "Demande de réinitialisation de mot de passe.",
    ipAddress,
  });
};

const resetPassword = async ({ token, newPassword, ipAddress }) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await passwordResetModel.findValidByTokenHash(tokenHash);

  if (!record) {
    throw makeError(
      "Ce lien de réinitialisation est invalide ou a expiré.",
      400,
    );
  }

  const newPasswordHash = await hashPassword(newPassword);
  await userModel.updatePassword(record.user_id, newPasswordHash);
  await passwordResetModel.markUsed(record.id);

  logSecurityEvent({
    userId: record.user_id,
    eventType: "PASSWORD_RESET",
    message: "Mot de passe réinitialisé via le lien reçu par e-mail.",
    ipAddress,
  });
};

module.exports = {
  register,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
