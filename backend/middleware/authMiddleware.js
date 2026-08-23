// backend/middleware/authMiddleware.js
// Protège une route : refuse la requête si le token est absent ou invalide.

const { verifyToken } = require("../utils/generateToken");
const { logSecurityEvent } = require("../utils/logger");
const { isTokenBlacklisted } = require("../services/cacheService");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logSecurityEvent({
      userId: null,
      eventType: "ACCESS_DENIED",
      message: `Accès refusé (en-tête Authorization absent) sur ${req.originalUrl}.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(401).json({
      success: false,
      message: "Authentification requise.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    // Si Redis est indisponible, isTokenBlacklisted renvoie false (mode
    // dégradé) : un token déconnecté reste alors valide jusqu'à son
    // expiration naturelle, mais l'authentification elle-même n'est
    // jamais bloquée par une panne de Redis.
    if (await isTokenBlacklisted(token)) {
      logSecurityEvent({
        userId: decoded.id,
        eventType: "ACCESS_DENIED",
        message: `Accès refusé (token révoqué après déconnexion) sur ${req.originalUrl}.`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(401).json({
        success: false,
        message: "Session expirée ou token invalide.",
      });
    }

    // Disponible dans tous les contrôleurs situés après ce middleware.
    req.user = { id: decoded.id, role: decoded.role };

    return next();
  } catch {
    logSecurityEvent({
      userId: null,
      eventType: "ACCESS_DENIED",
      message: `Accès refusé (token invalide ou expiré) sur ${req.originalUrl}.`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(401).json({
      success: false,
      message: "Session expirée ou token invalide.",
    });
  }
};

module.exports = { protect };