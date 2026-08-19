// backend/utils/generateToken.js

const jwt = require("jsonwebtoken");

// Import sans déstructuration : jwtConfig expose des accesseurs relus à
// chaque appel (utile notamment pour les tests, qui fixent JWT_SECRET
// après le chargement de ce module). Déstructurer figerait la valeur lue
// au moment de l'import.
const jwtConfig = require("../config/jwt");

// Le token contient l'identifiant et le rôle, rien de sensible.
// Il est signé : le client peut le lire, mais pas le modifier.
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    jwtConfig.JWT_SECRET,
    {
      expiresIn: jwtConfig.JWT_EXPIRES_IN,
    },
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };