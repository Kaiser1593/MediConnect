// backend/tests/generateToken.test.js
// Fonctions pures : aucun serveur ni base de données requis.

const jwt = require("jsonwebtoken");

const { generateToken, verifyToken } = require("../utils/generateToken");

describe("generateToken / verifyToken", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "secret-de-test";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  it("génère un token vérifiable contenant le bon id et le bon rôle", () => {
    const token = generateToken({ id: 42, role: "doctor" });
    const decoded = verifyToken(token);

    expect(decoded.id).toBe(42);
    expect(decoded.role).toBe("doctor");
  });

  it("rejette un token signé avec une autre clé", () => {
    const forgedToken = jwt.sign({ id: 1, role: "admin" }, "mauvaise-cle");

    expect(() => verifyToken(forgedToken)).toThrow();
  });

  it("rejette un token expiré", () => {
    const expiredToken = jwt.sign(
      { id: 1, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: -10 },
    );

    expect(() => verifyToken(expiredToken)).toThrow();
  });
});
