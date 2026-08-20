// backend/controllers/reviewController.js

const reviewService = require("../services/reviewService");

const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Le rendez-vous et la note sont obligatoires.",
      });
    }

    const ratingNumber = Number(rating);

    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({
        success: false,
        message: "La note doit être un entier entre 1 et 5.",
      });
    }

    const review = await reviewService.createReview(req.user.id, {
      appointmentId,
      rating: ratingNumber,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Merci pour votre avis.",
      review,
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.listDoctorReviews(req.params.id);

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getDoctorReviews,
};
