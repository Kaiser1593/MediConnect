// backend/routes/appointmentRoutes.js

const express = require("express");

const {
  createAppointment,
  getMyDashboard,
  listMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  confirmAppointment,
  completeAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validateBody } = require("../middleware/validationMiddleware");
const { isValidDate, isValidTime } = require("../utils/validators");

const router = express.Router();

// Le message "requis" reprend exactement celui déjà renvoyé par le
// contrôleur. Les formats de date/heure sont des vérifications nouvelles :
// la date reprend le message déjà utilisé plus loin dans le service (même
// contrôle, fait plus tôt), l'heure n'était auparavant pas validée du tout
// (un horaire mal formé aurait simplement fini en "créneau indisponible").
const createAppointmentSchema = {
  doctorId: {
    required: true,
    requiredMessage: "Le médecin, la date et l'horaire sont obligatoires.",
  },
  scheduledOn: {
    required: true,
    requiredMessage: "Le médecin, la date et l'horaire sont obligatoires.",
    validate: isValidDate,
    invalidMessage: "La date doit être au format AAAA-MM-JJ.",
  },
  startTime: {
    required: true,
    requiredMessage: "Le médecin, la date et l'horaire sont obligatoires.",
    validate: isValidTime,
    invalidMessage: "L'horaire doit être au format HH:MM.",
  },
};

// Seul un patient réserve un rendez-vous pour lui-même.
router.post(
  "/",
  protect,
  authorize("patient"),
  validateBody(createAppointmentSchema),
  createAppointment,
);

router.get("/", protect, authorize("patient", "doctor"), listMyAppointments);
router.get("/me", protect, authorize("patient", "doctor"), getMyDashboard);

router.patch(
  "/:id/cancel",
  protect,
  authorize("patient", "doctor"),
  cancelAppointment,
);

// Réservée au patient, comme la réservation initiale : annule puis
// recrée le rendez-vous au nouveau créneau (voir appointmentService).
router.patch(
  "/:id/reschedule",
  protect,
  authorize("patient"),
  validateBody({
    scheduledOn: {
      required: true,
      requiredMessage: "La date et l'horaire sont obligatoires.",
      validate: isValidDate,
      invalidMessage: "La date doit être au format AAAA-MM-JJ.",
    },
    startTime: {
      required: true,
      requiredMessage: "La date et l'horaire sont obligatoires.",
      validate: isValidTime,
      invalidMessage: "L'horaire doit être au format HH:MM.",
    },
  }),
  rescheduleAppointment,
);

// Confirmation et clôture sont des actions réservées au médecin.
router.patch("/:id/confirm", protect, authorize("doctor"), confirmAppointment);
router.patch(
  "/:id/complete",
  protect,
  authorize("doctor"),
  completeAppointment,
);

module.exports = router;
