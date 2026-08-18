// backend/controllers/authController.js

const bcrypt = require("bcrypt");

const userModel = require("../models/userModel");
const { generateToken } = require("../utils/generateToken");

const SALT_ROUNDS = 12;

// Les rôles qu'un visiteur peut choisir librement.
// "admin" en est volontairement absent : un compte administrateur
// ne se crée jamais via le formulaire public.
const PUBLIC_ROLES = ["patient", "doctor"];

const registerUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, role, password, confirmPassword } =
      req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !role ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Le type de compte sélectionné est invalide.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await userModel.emailExists(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: "Un compte existe déjà avec cette adresse e-mail.",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userModel.createWithProfile({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Votre compte a bien été créé.",
      token,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "L'adresse e-mail et le mot de passe sont obligatoires.",
      });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());

    // Message volontairement identique que l'e-mail existe ou non :
    // sinon le formulaire permettrait de deviner quels comptes existent.
    const invalidCredentials = {
      success: false,
      message: "Adresse e-mail ou mot de passe incorrect.",
    };

    if (!user) {
      return res.status(401).json(invalidCredentials);
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json(invalidCredentials);
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Ce compte a été désactivé. Contactez l'administration.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Renvoie le profil de l'utilisateur authentifié.
// req.user est posé par le middleware d'authentification.
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

// Changement de mot de passe pour l'utilisateur connecté, quel que soit
// son rôle : exige l'ancien mot de passe, comme toute page "Paramètres".
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    const record = await userModel.findPasswordHashById(req.user.id);

    const currentMatches = await bcrypt.compare(
      currentPassword,
      record.password_hash,
    );

    if (!currentMatches) {
      return res.status(401).json({
        success: false,
        message: "Le mot de passe actuel est incorrect.",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePassword(req.user.id, newPasswordHash);

    return res.status(200).json({
      success: true,
      message: "Votre mot de passe a été mis à jour.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
};