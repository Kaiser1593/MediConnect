// backend/controllers/doctorController.js

const doctorModel = require("../models/doctorModel");
const appointmentService = require("../services/appointmentService");
const cacheService = require("../services/cacheService");

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

    // Lecture publique uniquement : la validation d'une réservation
    // recalcule toujours les créneaux depuis MySQL (voir appointmentService),
    // jamais depuis ce cache, pour ne jamais affaiblir la protection contre
    // le double-booking.
    const cached = await cacheService.getCachedAvailability(req.params.id, date);
    const slots =
      cached || (await appointmentService.computeAvailableSlots(doctor, date));

    if (!cached) {
      await cacheService.setCachedAvailability(req.params.id, date, slots);
    }

    return res.status(200).json({ success: true, date, slots });
  } catch (error) {
    return next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await doctorModel.getOwnProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Fiche médecin introuvable.",
      });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      phone,
      specialtyId,
      licenseNumber,
      biography,
      address,
      city,
      postalCode,
      consultationPrice,
      experienceYears,
    } = req.body;

    if (!firstname || !lastname) {
      return res.status(400).json({
        success: false,
        message: "Le prénom et le nom sont obligatoires.",
      });
    }

    await doctorModel.updateOwnProfile(req.user.id, {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      phone,
      specialtyId,
      licenseNumber,
      biography,
      address,
      city,
      postalCode,
      consultationPrice,
      experienceYears,
    });

    const profile = await doctorModel.getOwnProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Votre profil a été mis à jour.",
      profile,
    });
  } catch (error) {
    return next(error);
  }
};

const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

const getMyAvailabilities = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Fiche médecin introuvable.",
      });
    }

    const availabilities = await doctorModel.getWeeklyAvailabilities(doctor.id);

    return res.status(200).json({ success: true, availabilities });
  } catch (error) {
    return next(error);
  }
};

const addMyAvailability = async (req, res, next) => {
  try {
    const { weekday, startTime, endTime } = req.body;
    const weekdayNumber = Number(weekday);

    if (!Number.isInteger(weekdayNumber) || weekdayNumber < 1 || weekdayNumber > 7) {
      return res.status(400).json({
        success: false,
        message: "Le jour doit être un nombre entre 1 (lundi) et 7 (dimanche).",
      });
    }

    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Les horaires doivent être au format HH:MM.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "L'heure de fin doit être après l'heure de début.",
      });
    }

    const doctor = await doctorModel.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Fiche médecin introuvable.",
      });
    }

    const availability = await doctorModel.addAvailability(doctor.id, {
      weekday: weekdayNumber,
      startTime,
      endTime,
    });

    return res.status(201).json({
      success: true,
      message: "Disponibilité ajoutée.",
      availability,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMyAvailability = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Fiche médecin introuvable.",
      });
    }

    const deleted = await doctorModel.deleteAvailability(req.params.id, doctor.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Disponibilité introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Disponibilité supprimée.",
    });
  } catch (error) {
    return next(error);
  }
};

const getMyPatients = async (req, res, next) => {
  try {
    const patients = await appointmentService.listMyPatients(req.user.id);

    return res.status(200).json({ success: true, patients });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
  getMyProfile,
  updateMyProfile,
  getMyAvailabilities,
  addMyAvailability,
  deleteMyAvailability,
  getMyPatients,
};
