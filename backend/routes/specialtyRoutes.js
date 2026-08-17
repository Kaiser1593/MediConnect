// backend/routes/specialtyRoutes.js

const express = require("express");

const { getAllSpecialties } = require("../controllers/specialtyController");

const router = express.Router();

router.get("/", getAllSpecialties);

module.exports = router;
