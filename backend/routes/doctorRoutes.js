// backend/routes/doctorRoutes.js
// L'annuaire public ne nécessite pas d'authentification, à l'image de
// v_doctors_public. Les routes "/me..." sont protégées et DOIVENT être
// déclarées avant "/:id", sinon Express les confond avec un identifiant
// de médecin.

const express = require("express");

const {
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
  getMyProfile,
  updateMyProfile,
  getMyAvailabilities,
  addMyAvailability,
  deleteMyAvailability,
  getMyPatients,
} = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", searchDoctors);

router.get("/me", protect, authorize("doctor"), getMyProfile);
router.patch("/me", protect, authorize("doctor"), updateMyProfile);

router.get("/me/patients", protect, authorize("doctor"), getMyPatients);

router.get(
  "/me/availabilities",
  protect,
  authorize("doctor"),
  getMyAvailabilities,
);
router.post(
  "/me/availabilities",
  protect,
  authorize("doctor"),
  addMyAvailability,
);
router.delete(
  "/me/availabilities/:id",
  protect,
  authorize("doctor"),
  deleteMyAvailability,
);

router.get("/:id", getDoctorById);
router.get("/:id/availability", getDoctorAvailability);

module.exports = router;
