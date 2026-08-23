// backend/routes/adminRoutes.js

const express = require("express");

const {
  getStats,
  getRegistrationStats,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  getAllAppointments,
  getStatistics,
  approveDoctor,
  rejectDoctor,
  updateUserStatus,
  banUser,
  deleteUser,
  getLogs,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Tout l'espace administrateur nécessite un token valide ET le rôle admin.
router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/stats/registrations", getRegistrationStats);
router.get("/users", getUsers);
router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors", getAllDoctors);
router.get("/appointments", getAllAppointments);
router.get("/statistics", getStatistics);
router.get("/logs", getLogs);
router.patch("/doctors/:id/approve", approveDoctor);
router.patch("/doctors/:id/reject", rejectDoctor);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Alias "PUT /api/admin/users/:id/ban" du dossier (§3.5). PATCH ajouté pour
// la même raison que sur les routes de rendez-vous : verbe sémantiquement
// correct, sans casser la conformité au dossier.
router.route("/users/:id/ban").put(banUser).patch(banUser);

module.exports = router;
