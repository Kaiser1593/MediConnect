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
const { getDoctorReviews } = require("../controllers/reviewController");
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

// Variante en chemin de GET /?specialty=..., réutilisant searchDoctors tel
// quel. DOIT être déclarée avant "/:id", sinon Express confond "specialty"
// avec un identifiant de médecin.
router.get("/specialty/:id", (req, res, next) => {
  req.query.specialty = req.params.id;
  return searchDoctors(req, res, next);
});

router.get("/:id", getDoctorById);
router.get("/:id/availability", getDoctorAvailability);
router.get("/:id/reviews", getDoctorReviews);

module.exports = router;
