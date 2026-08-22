// backend/middleware/roleMiddleware.js
// Restreint une route protégée à certains rôles.
// À chaîner après "protect", qui pose req.user.

const { logSecurityEvent } = require("../utils/logger");

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logSecurityEvent({
        userId: req.user.id,
        eventType: "ACCESS_DENIED",
        message: `Rôle "${req.user.role}" refusé sur ${req.originalUrl} (rôles autorisés : ${roles.join(", ")}).`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(403).json({
        success: false,
        message: "Accès refusé : vous n'avez pas les droits nécessaires.",
      });
    }

    return next();
  };
};

module.exports = { authorize };
