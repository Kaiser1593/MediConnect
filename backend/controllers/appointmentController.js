// backend/controllers/appointmentController.js

const appointmentService = require("../services/appointmentService");

const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, scheduledOn, startTime, reason } = req.body;

    if (!doctorId || !scheduledOn || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Le médecin, la date et l'horaire sont obligatoires.",
      });
    }

    const appointment = await appointmentService.bookAppointment({
      patientUserId: req.user.id,
      doctorId,
      scheduledOn,
      startTime,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "Rendez-vous confirmé.",
      appointment,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyDashboard = async (req, res, next) => {
  try {
    const data =
      req.user.role === "doctor"
        ? await appointmentService.getDoctorDashboard(req.user.id)
        : await appointmentService.getPatientDashboard(req.user.id);

    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return next(error);
  }
};

const listMyAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.listMyAppointments(req.user);

    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    return next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    await appointmentService.cancelAppointment(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Le rendez-vous a été annulé.",
    });
  } catch (error) {
    return next(error);
  }
};

const confirmAppointment = async (req, res, next) => {
  try {
    await appointmentService.confirmAppointment(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Le rendez-vous a été confirmé.",
    });
  } catch (error) {
    return next(error);
  }
};

const completeAppointment = async (req, res, next) => {
  try {
    const { doctorNotes } = req.body;

    await appointmentService.completeAppointment(
      req.user,
      req.params.id,
      doctorNotes,
    );

    return res.status(200).json({
      success: true,
      message: "Le rendez-vous a été marqué comme terminé.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAppointment,
  getMyDashboard,
  listMyAppointments,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
};
