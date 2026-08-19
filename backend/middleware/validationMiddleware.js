// backend/middleware/validationMiddleware.js
// Middleware générique de validation du corps de requête, placé avant le
// contrôleur. Chaque champ du schéma peut définir :
//   - required        : le champ doit être présent (comme "!valeur", à
//                        l'image des contrôleurs existants)
//   - requiredMessage  : message renvoyé si le champ est manquant
//   - validate         : fonction de format (valeur, corps complet) => bool
//   - invalidMessage   : message renvoyé si le format est invalide
//
// Les champs sont évalués dans l'ordre de déclaration du schéma, en deux
// passes (présence puis format), pour rester au plus près des messages déjà
// renvoyés par les contrôleurs existants.

const validateBody = (schema) => {
  return (req, res, next) => {
    const entries = Object.entries(schema);

    for (const [field, rules] of entries) {
      if (rules.required && !req.body[field]) {
        return res.status(400).json({
          success: false,
          message: rules.requiredMessage || "Certains champs sont obligatoires.",
          invalidFields: [field],
        });
      }
    }

    for (const [field, rules] of entries) {
      const value = req.body[field];

      if (value && rules.validate && !rules.validate(value, req.body)) {
        return res.status(400).json({
          success: false,
          message: rules.invalidMessage || "Certains champs sont invalides.",
          invalidFields: [field],
        });
      }
    }

    return next();
  };
};

module.exports = { validateBody };
