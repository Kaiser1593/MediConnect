// backend/routes/appointmentRoutes.js

const express = require("express");

const {
  createAppointment,
  getMyDashboard,
  listMyAppointments,
  cancelAppointment,
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

module.exports = router;
