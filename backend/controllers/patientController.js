// backend/controllers/patientController.js

const patientModel = require("../models/patientModel");

const GENDERS = ["female", "male", "other"];

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await patientModel.getProfileByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Fiche patient introuvable.",
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
      birthDate,
      gender,
      address,
      city,
      postalCode,
    } = req.body;

    if (!firstname || !lastname) {
      return res.status(400).json({
        success: false,
        message: "Le prénom et le nom sont obligatoires.",
      });
    }

    if (gender && !GENDERS.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Le genre renseigné est invalide.",
      });
    }

    await patientModel.updateProfile(req.user.id, {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      phone,
      birthDate,
      gender,
      address,
      city,
      postalCode,
    });

    const profile = await patientModel.getProfileByUserId(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Votre profil a été mis à jour.",
      profile,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile };
