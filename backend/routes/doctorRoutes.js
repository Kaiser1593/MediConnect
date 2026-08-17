// backend/routes/doctorRoutes.js
// Annuaire public des médecins : aucune de ces routes ne nécessite
// d'authentification, à l'image de v_doctors_public.

const express = require("express");

const {
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", searchDoctors);
router.get("/:id", getDoctorById);
router.get("/:id/availability", getDoctorAvailability);

module.exports = router;
