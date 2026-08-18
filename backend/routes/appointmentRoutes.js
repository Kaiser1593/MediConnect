// backend/routes/appointmentRoutes.js

const express = require("express");

const {
  createAppointment,
  getMyDashboard,
  listMyAppointments,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Seul un patient réserve un rendez-vous pour lui-même.
router.post("/", protect, authorize("patient"), createAppointment);

router.get("/", protect, authorize("patient", "doctor"), listMyAppointments);
router.get("/me", protect, authorize("patient", "doctor"), getMyDashboard);

router.patch(
  "/:id/cancel",
  protect,
  authorize("patient", "doctor"),
  cancelAppointment,
);

// Confirmation et clôture sont des actions réservées au médecin.
router.patch("/:id/confirm", protect, authorize("doctor"), confirmAppointment);
router.patch(
  "/:id/complete",
  protect,
  authorize("doctor"),
  completeAppointment,
);

module.exports = router;
