// backend/controllers/adminController.js

const adminModel = require("../models/adminModel");
const userModel = require("../models/userModel");
const { logSecurityEvent } = require("../utils/logger");

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Complète les mois sans inscription à zéro : sans ça, un mois vide
// disparaîtrait du graphique au lieu d'y apparaître comme creux.
const buildMonthlySeries = (rows, months) => {
  const countByMonth = new Map(rows.map((row) => [row.month, row.total]));
  const series = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    series.push({
      label: MONTH_LABELS[date.getMonth()],
      count: countByMonth.get(key) || 0,
    });
  }

  return series;
};

// Un seul barreau mensuel ne montrerait rien d'une évolution sur la vue
// "dernier mois" : ce cas descend à la semaine (lundi à dimanche) plutôt
// qu'au mois, en couvrant les 30 derniers jours.
const buildWeeklySeries = (rows) => {
  const countByWeekStart = new Map(rows.map((row) => [row.week_start, row.total]));
  const series = [];
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7; // 0 = lundi de cette semaine
  const currentMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
  const weekCount = 5; // couvre large les 30 derniers jours (4 semaines pleines + la semaine en cours)

  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const weekStart = new Date(
      currentMonday.getFullYear(),
      currentMonday.getMonth(),
      currentMonday.getDate() - i * 7,
    );
    const key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

    series.push({
      label: `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`,
      count: countByWeekStart.get(key) || 0,
    });
  }

  return series;
};

const getStats = async (req, res, next) => {
  try {
    const stats = await adminModel.getStats();

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return next(error);
  }
};

const ALLOWED_REGISTRATION_PERIODS = [1, 3, 6];

// Alimente le graphique "Évolution des inscriptions" du tableau de bord.
// Vue "dernier mois" : une barre par semaine (30 derniers jours). Vues
// "3/6 derniers mois" : une barre par mois. Les deux se complètent à
// zéro sur les semaines/mois sans inscription, pour ne jamais faire
// disparaître un creux.
const getRegistrationStats = async (req, res, next) => {
  try {
    const months = ALLOWED_REGISTRATION_PERIODS.includes(Number(req.query.months))
      ? Number(req.query.months)
      : 6;

    if (months === 1) {
      const rows = await adminModel.getRegistrationsByWeek(30);

      return res.status(200).json({
        success: true,
        granularity: "week",
        series: buildWeeklySeries(rows),
      });
    }

    const rows = await adminModel.getRegistrationsByMonth(months);

    return res.status(200).json({
      success: true,
      granularity: "month",
      series: buildMonthlySeries(rows, months),
    });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { rows, total } = await adminModel.getUsers({
      limit,
      offset,
      role: req.query.role,
    });

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

// Retire la validation d'un médecin (déjà validé, ou validé par erreur) :
// il redevient invisible dans la recherche publique. Ne supprime rien,
// symétrique de approveDoctor.
const rejectDoctor = async (req, res, next) => {
  try {
    const revoked = await adminModel.revokeDoctorApproval(req.params.id);

    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: "Médecin introuvable.",
      });
    }

    logSecurityEvent({
      userId: req.user.id,
      eventType: "DOCTOR_REVOKED",
      message: `Validation du médecin #${req.params.id} révoquée par l'administrateur.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "La validation du médecin a été révoquée.",
    });
  } catch (error) {
    return next(error);
  }
};

// Partagé par updateUserStatus (activation/désactivation via le corps de la
// requête) et banUser (alias "/ban" du dossier, toujours une désactivation).
const applyUserActiveStatus = async (req, res, is_active) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Vous ne pouvez pas modifier le statut de votre propre compte.",
    });
  }

  // Un compte administrateur ne se crée jamais depuis l'interface (voir
  // authService.PUBLIC_ROLES) : par cohérence, il ne se désactive/active
  // pas non plus depuis cette interface, seulement via
  // backend/scripts/createAdmin.js.
  const targetUser = await userModel.findById(targetId);

  if (targetUser?.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Le statut d'un autre compte administrateur ne peut pas être modifié depuis cette interface.",
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
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Le champ is_active doit être un booléen.",
      });
    }

    return await applyUserActiveStatus(req, res, is_active);
  } catch (error) {
    return next(error);
  }
};

// Alias "PUT /api/admin/users/:id/ban" du dossier (§3.5) : bannir signifie
// toujours désactiver, aucun corps de requête n'est nécessaire. Réutilise la
// même logique que updateUserStatus (utilisée par l'interface d'administration
// sous /status, qui gère aussi la réactivation).
const banUser = async (req, res, next) => {
  try {
    return await applyUserActiveStatus(req, res, false);
  } catch (error) {
    return next(error);
  }
};

// Suppression d'un compte par un administrateur : purge réelle, pas une
// anonymisation. Distincte de la suppression volontaire par l'utilisateur
// lui-même (droit à l'effacement RGPD, voir authService.deleteAccount),
// qui reste une anonymisation pour préserver l'historique de l'autre
// partie. Ici, décision assumée d'un administrateur : la ligne et tout ce
// qui en dépend (rendez-vous, avis) sont réellement supprimés de MySQL.
// Voir docs/RGPD.md pour la distinction complète.
const deleteUser = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte depuis cette page.",
      });
    }

    const targetUser = await userModel.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    // Même règle que pour la désactivation : un compte administrateur ne
    // se gère pas depuis cette interface.
    if (targetUser.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Le compte d'un autre administrateur ne peut pas être supprimé depuis cette interface.",
      });
    }

    const deleted = await userModel.hardDelete(targetId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    logSecurityEvent({
      userId: req.user.id,
      eventType: "ACCOUNT_ANONYMIZED",
      message: `Compte #${targetId} (${targetUser.email}) supprimé définitivement par l'administrateur.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Le compte a été supprimé définitivement.",
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
  getRegistrationStats,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  getAllAppointments,
  getStatistics,
  approveDoctor,
  rejectDoctor,
  updateUserStatus,
  banUser,
  deleteUser,
  getLogs,
};
