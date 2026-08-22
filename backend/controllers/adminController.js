// backend/controllers/adminController.js

const adminModel = require("../models/adminModel");
const { logSecurityEvent } = require("../utils/logger");

const getStats = async (req, res, next) => {
  try {
    const stats = await adminModel.getStats();

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { rows, total } = await adminModel.getUsers({ limit, offset });

    return res.status(200).json({
      success: true,
      users: rows,
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

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await adminModel.getPendingDoctors();

    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    return next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { rows, total } = await adminModel.getAllDoctors({ limit, offset });

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

const getAllAppointments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const { rows, total } = await adminModel.getAllAppointments({
      limit,
      offset,
      status,
    });

    return res.status(200).json({
      success: true,
      appointments: rows,
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

const getStatistics = async (req, res, next) => {
  try {
    const [usersByRole, appointmentsByStatus, doctorsBySpecialty] =
      await Promise.all([
        adminModel.getUsersByRole(),
        adminModel.getAppointmentsByStatus(),
        adminModel.getDoctorsBySpecialty(),
      ]);

    return res.status(200).json({
      success: true,
      usersByRole,
      appointmentsByStatus,
      doctorsBySpecialty,
    });
  } catch (error) {
    return next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const approved = await adminModel.approveDoctor(req.params.id);

    if (!approved) {
      return res.status(404).json({
        success: false,
        message: "Médecin introuvable.",
      });
    }

    logSecurityEvent({
      userId: req.user.id,
      eventType: "DOCTOR_APPROVED",
      message: `Médecin #${req.params.id} validé par l'administrateur.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Le compte du médecin a été validé.",
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Le champ is_active doit être un booléen.",
      });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas modifier le statut de votre propre compte.",
      });
    }

    const updated = await adminModel.setUserActiveStatus(targetId, is_active);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    logSecurityEvent({
      userId: req.user.id,
      eventType: "USER_STATUS_CHANGED",
      message: `Compte #${targetId} ${is_active ? "activé" : "désactivé"} par l'administrateur.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: is_active ? "Compte activé." : "Compte désactivé.",
    });
  } catch (error) {
    return next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const { event_type: eventType } = req.query;

    const { rows, total } = await adminModel.getSecurityLogs({
      limit,
      offset,
      eventType,
    });

    return res.status(200).json({
      success: true,
      logs: rows,
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

module.exports = {
  getStats,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  getAllAppointments,
  getStatistics,
  approveDoctor,
  updateUserStatus,
  getLogs,
};
