// backend/config/jwt.js
// Centralise la configuration JWT, consommée par utils/generateToken.js.
// Des accesseurs (et non des constantes figées) : dotenv est chargé après
// l'import de ce module dans certains contextes (tests), la valeur doit
// donc être relue à chaque utilisation plutôt que capturée une seule fois.

module.exports = {
  get JWT_SECRET() {
    return process.env.JWT_SECRET;
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
};
