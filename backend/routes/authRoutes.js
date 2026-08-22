// backend/routes/authRoutes.js

const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  exportMyData,
  deleteMyAccount,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validationMiddleware");
const { isValidEmail } = require("../utils/validators");

const router = express.Router();

// Les messages "requis" reprennent exactement ceux déjà renvoyés par les
// contrôleurs : seul le format de l'e-mail est une vérification nouvelle,
// qu'aucun utilisateur légitime ne pouvait de toute façon déclencher.
const registerSchema = {
  firstname: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
  },
  lastname: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
  },
  email: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
    validate: isValidEmail,
    invalidMessage: "L'adresse e-mail n'est pas valide.",
  },
  role: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
  },
  password: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
  },
  confirmPassword: {
    required: true,
    requiredMessage: "Tous les champs obligatoires doivent être renseignés.",
  },
};

// Volontairement sans validation de format : une connexion doit se
// comporter à l'identique quelle que soit la forme de l'e-mail saisi,
// pour ne pas révéler d'information avant la vérification des identifiants.
const loginSchema = {
  email: {
    required: true,
    requiredMessage: "L'adresse e-mail et le mot de passe sont obligatoires.",
  },
  password: {
    required: true,
    requiredMessage: "L'adresse e-mail et le mot de passe sont obligatoires.",
  },
};

// Contre le brute force : 10 tentatives par IP toutes les 15 minutes.
// Ne compte que les tentatives échouées, pour ne jamais bloquer un
// utilisateur légitime qui enchaîne des connexions réussies (plusieurs
// appareils, par exemple).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  },
});

router.post("/register", validateBody(registerSchema), registerUser);
router.post("/login", loginLimiter, validateBody(loginSchema), loginUser);

// Volontairement sans validation de format, comme /login : la réponse est
// identique quelle que soit l'adresse saisie (voir authService).
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Route protégée : nécessite un token valide.
router.get("/me", protect, getCurrentUser);
router.patch("/password", protect, changePassword);
router.post("/logout", protect, logoutUser);
router.get("/me/export", protect, exportMyData);
router.delete("/me", protect, deleteMyAccount);

module.exports = router;