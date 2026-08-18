// backend/routes/patientRoutes.js

const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/me", protect, authorize("patient"), getMyProfile);
router.patch("/me", protect, authorize("patient"), updateMyProfile);

module.exports = router;
