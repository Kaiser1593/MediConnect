// backend/utils/generateToken.js

const jwt = require("jsonwebtoken");

// Le token contient l'identifiant et le rôle, rien de sensible.
// Il est signé : le client peut le lire, mais pas le modifier.
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };