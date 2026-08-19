// backend/routes/notificationRoutes.js

const express = require("express");

const {
  getMyNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Accessible à tout utilisateur connecté, quel que soit son rôle :
// chacun ne voit que ses propres notifications (filtrées par req.user.id).
router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;
