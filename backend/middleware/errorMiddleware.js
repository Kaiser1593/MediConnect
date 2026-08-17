// backend/middleware/errorMiddleware.js
// Attrape tout ce qui est passé à next(error) dans les contrôleurs.
// À déclarer EN DERNIER dans app.js, après toutes les routes.

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.originalUrl}`,
  });
};

const errorHandler = (error, req, res, next) => {
  console.error(error);

  // Violation d'une contrainte UNIQUE (e-mail, créneau déjà réservé...).
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Cette donnée existe déjà.",
    });
  }

  const status = error.statusCode || 500;

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Une erreur interne est survenue."
        : error.message,
  });
};

module.exports = { notFound, errorHandler };