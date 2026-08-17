// backend/controllers/specialtyController.js

const specialtyModel = require("../models/specialtyModel");

const getAllSpecialties = async (req, res, next) => {
  try {
    const specialties = await specialtyModel.getAll();

    return res.status(200).json({ success: true, specialties });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllSpecialties };
