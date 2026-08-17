// backend/middleware/roleMiddleware.js
// Restreint une route protégée à certains rôles.
// À chaîner après "protect", qui pose req.user.

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé : vous n'avez pas les droits nécessaires.",
      });
    }

    return next();
  };
};

module.exports = { authorize };
