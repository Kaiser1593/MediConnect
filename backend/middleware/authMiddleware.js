// backend/middleware/authMiddleware.js
// Protège une route : refuse la requête si le token est absent ou invalide.

const { verifyToken } = require("../utils/generateToken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    // Disponible dans tous les contrôleurs situés après ce middleware.
    req.user = { id: decoded.id, role: decoded.role };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expirée ou token invalide.",
    });
  }
};

module.exports = { protect };