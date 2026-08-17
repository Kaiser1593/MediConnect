// backend/routes/appointmentRoutes.js

const express = require("express");

const {
  createAppointment,
  getMyDashboard,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Seul un patient réserve un rendez-vous pour lui-même.
router.post("/", protect, authorize("patient"), createAppointment);

router.get("/me", protect, authorize("patient", "doctor"), getMyDashboard);

module.exports = router;
