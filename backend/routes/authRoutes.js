// backend/routes/authRoutes.js

const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Route protégée : nécessite un token valide.
router.get("/me", protect, getCurrentUser);

module.exports = router;