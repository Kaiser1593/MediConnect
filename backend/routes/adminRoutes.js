// backend/routes/adminRoutes.js

const express = require("express");

const {
  getStats,
  getUsers,
  getPendingDoctors,
  approveDoctor,
  updateUserStatus,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Tout l'espace administrateur nécessite un token valide ET le rôle admin.
router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/doctors/:id/approve", approveDoctor);
router.patch("/users/:id/status", updateUserStatus);

module.exports = router;
