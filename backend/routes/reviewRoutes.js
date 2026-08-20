// backend/routes/reviewRoutes.js

const express = require("express");

const { createReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Seul un patient laisse un avis, sur l'un de ses propres rendez-vous.
router.post("/", protect, authorize("patient"), createReview);

module.exports = router;
