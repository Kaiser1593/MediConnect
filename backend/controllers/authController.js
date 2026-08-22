// backend/controllers/authController.js
// Ne garde que la validation du format des champs et la construction de
// la réponse HTTP : la logique métier vit dans services/authService.js.

const userModel = require("../models/userModel");
const authService = require("../services/authService");

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

    const { user, token } = await authService.register({
      firstname,
      lastname,
      email,
      role,
      password,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

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

    const { user, token } = await authService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user,
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

    await authService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Votre mot de passe a été mis à jour.",
    });
  } catch (error) {
    return next(error);
  }
};

// Toujours le même message, que l'adresse existe ou non, et que l'envoi
// de l'e-mail ait réussi ou non côté serveur (voir authService) : sinon
// la réponse permettrait de deviner quels comptes existent.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "L'adresse e-mail est obligatoire.",
      });
    }

    await authService.requestPasswordReset({
      email,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé.",
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
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

    await authService.resetPassword({
      token,
      newPassword,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.",
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
  forgotPassword,
  resetPassword,
};
