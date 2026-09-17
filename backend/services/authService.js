// backend/services/authService.js
// Logique métier de l'authentification : le contrôleur ne garde que la
// validation du format des champs et la construction de la réponse HTTP.

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { deleteAvatarFile } = require("../middleware/uploadMiddleware");

const userModel = require("../models/userModel");
const patientModel = require("../models/patientModel");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const reviewModel = require("../models/reviewModel");
const notificationModel = require("../models/notificationModel");
const passwordResetModel = require("../models/passwordResetModel");
const { generateToken } = require("../utils/generateToken");
const { logSecurityEvent } = require("../utils/logger");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const emailService = require("./emailService");
const cacheService = require("./cacheService");

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

const register = async ({ firstname, lastname, email, role, password, ipAddress, userAgent }) => {
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
    userAgent,
  });

  return { user, token };
};

// Message volontairement identique que l'e-mail existe ou non, ou que le
// mot de passe soit erroné : sinon la réponse permettrait de deviner
// quels comptes existent.
const login = async ({ email, password, ipAddress, userAgent }) => {
  const invalidCredentials = () =>
    makeError("Adresse e-mail ou mot de passe incorrect.", 401);

  const user = await userModel.findByEmail(email.trim().toLowerCase());

  if (!user) {
    logSecurityEvent({
      userId: null,
      eventType: "LOGIN_FAILED",
      message: "Tentative de connexion avec une adresse e-mail inconnue.",
      ipAddress,
      userAgent,
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
      userAgent,
    });

    throw invalidCredentials();
  }

  if (!user.is_active) {
    logSecurityEvent({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      message: "Tentative de connexion sur un compte désactivé.",
      ipAddress,
      userAgent,
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
    userAgent,
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

const changePassword = async ({ userId, currentPassword, newPassword, ipAddress, userAgent }) => {
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
    userAgent,
  });
};

// Message identique et succès renvoyé au contrôleur que l'adresse existe
// ou non : révéler la différence permettrait de deviner quels e-mails
// sont inscrits. L'échec d'envoi du mail (SMTP en panne, par exemple)
// n'est jamais remonté au client pour la même raison ; il est seulement
// tracé côté serveur.
const requestPasswordReset = async ({ email, ipAddress, userAgent }) => {
  const user = await userModel.findByEmail(email.trim().toLowerCase());

  if (!user) {
    logSecurityEvent({
      userId: null,
      eventType: "PASSWORD_RESET_REQUESTED",
      message: "Demande de réinitialisation sur une adresse e-mail inconnue.",
      ipAddress,
      userAgent,
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
    userAgent,
  });
};

const resetPassword = async ({ token, newPassword, ipAddress, userAgent }) => {
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
    userAgent,
  });
};

// Le token a déjà été vérifié par le middleware "protect" avant d'arriver
// ici : on se contente de lire sa date d'expiration (jwt.decode, sans
// re-vérifier la signature) pour ne le garder en liste noire que le temps
// qu'il lui restait à vivre, jamais plus.
const logout = async ({ token }) => {
  const decoded = jwt.decode(token);
  const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;

  await cacheService.blacklistToken(token, ttlSeconds);
};

// Droit d'accès RGPD : renvoie toutes les données personnelles détenues
// sur l'utilisateur, dans un format destiné à être téléchargé, pas
// affiché (voir authController.exportMyData).
const exportPersonalData = async ({ userId, role }) => {
  const account = await userModel.exportAccountData(userId);

  let profile = null;
  let appointments = [];
  let reviews = [];

  if (role === "patient") {
    profile = await patientModel.getProfileByUserId(userId);

    const patient = await patientModel.findByUserId(userId);
    if (patient) {
      appointments = await appointmentModel.getAllByPatientId(patient.id);
      reviews = await reviewModel.getByPatientId(patient.id);
    }
  } else if (role === "doctor") {
    profile = await doctorModel.getOwnProfile(userId);

    const doctor = await doctorModel.findByUserId(userId);
    if (doctor) {
      appointments = await appointmentModel.getAllByDoctorId(doctor.id);
    }
  }

  const notifications = await notificationModel.getByUserId(userId);

  return {
    exportedAt: new Date().toISOString(),
    account,
    profile,
    appointments,
    reviews,
    notifications,
  };
};

// Droit à l'effacement RGPD. N'efface jamais la ligne utilisateurs (ni les
// rendez-vous/avis qui en dépendent, protégés par ON DELETE CASCADE sur
// patients/medecins) : anonymise à la place, pour que l'historique
// médical reste cohérent pour l'autre partie (médecin ou patient) tout en
// retirant les données personnelles identifiantes. Voir CHANGELOG pour la
// justification complète.
const deleteAccount = async ({
  userId,
  role,
  token,
  ipAddress,
  userAgent,
  initiatedBy = "self",
}) => {
  const anonymizedEmail = `compte-supprime-${userId}@anonymise.mediconnect.local`;
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

  await userModel.anonymizeAccount(userId, { anonymizedEmail, passwordHash });

  if (role === "patient") {
    await patientModel.updateProfile(userId, {
      firstname: "Compte",
      lastname: "supprimé",
      phone: null,
      birthDate: null,
      gender: null,
      address: null,
      city: null,
      postalCode: null,
    });
  } else if (role === "doctor") {
    const current = await doctorModel.getOwnProfile(userId);

    await doctorModel.updateOwnProfile(userId, {
      firstname: "Compte",
      lastname: "supprimé",
      phone: null,
      specialtyId: current?.specialty_id || null,
      licenseNumber: current?.license_number || null,
      biography: null,
      address: null,
      city: null,
      postalCode: null,
      consultationPrice: current?.consultation_price || null,
      experienceYears: current?.experience_years || null,
    });

    await doctorModel.revokeValidation(userId);
  }

  // Un administrateur qui supprime le compte d'un tiers n'a pas le token
  // de ce tiers à révoquer : il reste valide jusqu'à son expiration
  // naturelle (comme pour une simple suspension de compte, déjà le cas
  // ailleurs dans l'application), sans jamais bloquer l'appel courant.
  if (token) {
    const decoded = jwt.decode(token);
    const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
    await cacheService.blacklistToken(token, ttlSeconds);
  }

  logSecurityEvent({
    userId,
    eventType: "ACCOUNT_ANONYMIZED",
    message:
      initiatedBy === "admin"
        ? "Compte anonymisé par un administrateur."
        : "Compte anonymisé à la demande de l'utilisateur (droit à l'effacement RGPD).",
    ipAddress,
    userAgent,
  });
};

// Remplace la photo de profil : l'ancien fichier (s'il existe) est
// supprimé une fois le nouveau enregistré en base, jamais avant — en cas
// d'échec de l'écriture en base, l'ancien avatar reste donc valide plutôt
// que de laisser le compte sans photo.
const uploadAvatar = async ({ userId, filename }) => {
  const previousAvatarUrl = await userModel.findAvatarById(userId);
  const avatarUrl = `/uploads/avatars/${filename}`;

  await userModel.updateAvatar(userId, avatarUrl);
  await deleteAvatarFile(previousAvatarUrl);

  return avatarUrl;
};

const removeAvatar = async ({ userId }) => {
  const previousAvatarUrl = await userModel.findAvatarById(userId);

  await userModel.updateAvatar(userId, null);
  await deleteAvatarFile(previousAvatarUrl);
};

module.exports = {
  register,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logout,
  exportPersonalData,
  deleteAccount,
  uploadAvatar,
  removeAvatar,
};
