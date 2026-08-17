// backend/controllers/doctorController.js

const doctorModel = require("../models/doctorModel");
const appointmentService = require("../services/appointmentService");

const searchDoctors = async (req, res, next) => {
  try {
    const { specialty, city, search } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const offset = (page - 1) * limit;

    const { rows, total } = await doctorModel.searchPublic({
      specialty,
      city,
      search,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      doctors: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorModel.getPublicById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Médecin introuvable ou non disponible.",
      });
    }

    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    return next(error);
  }
};

const getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre date est obligatoire (format AAAA-MM-JJ).",
      });
    }

    const doctor = await doctorModel.getPublicById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Médecin introuvable ou non disponible.",
      });
    }

    const slots = await appointmentService.computeAvailableSlots(doctor, date);

    return res.status(200).json({ success: true, date, slots });
  } catch (error) {
    return next(error);
  }
};

module.exports = { searchDoctors, getDoctorById, getDoctorAvailability };
