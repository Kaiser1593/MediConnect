// backend/routes/authRoutes.js

const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
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

router.post("/register", validateBody(registerSchema), registerUser);
router.post("/login", validateBody(loginSchema), loginUser);

// Route protégée : nécessite un token valide.
router.get("/me", protect, getCurrentUser);
router.patch("/password", protect, changePassword);

module.exports = router;