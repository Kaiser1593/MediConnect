// backend/tests/authMiddleware.test.js
// req/res sont simulés (objets simples) : aucun serveur réel n'est démarré.
// logger est mocké pour ne pas dépendre d'une connexion MySQL.

jest.mock("../utils/logger", () => ({ logSecurityEvent: jest.fn() }));

const jwt = require("jsonwebtoken");

const { protect } = require("../middleware/authMiddleware");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("protect", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "secret-de-test";
  });

  it("renvoie 401 si l'en-tête Authorization est absent", () => {
    const req = { headers: {}, ip: "127.0.0.1", originalUrl: "/api/test" };
    const res = buildRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('renvoie 401 si l\'en-tête ne commence pas par "Bearer "', () => {
    const req = {
      headers: { authorization: "Token abc123" },
      ip: "127.0.0.1",
      originalUrl: "/api/test",
    };
    const res = buildRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("pose req.user et appelle next() si le token est valide", async () => {
    const token = jwt.sign({ id: 7, role: "doctor" }, process.env.JWT_SECRET);
    const req = {
      headers: { authorization: `Bearer ${token}` },
      ip: "127.0.0.1",
      originalUrl: "/api/test",
    };
    const res = buildRes();
    const next = jest.fn();

    // Aucun Redis démarré en test : isTokenBlacklisted renvoie false
    // (mode dégradé), le token reste donc valide, comme en production
    // quand Redis est indisponible.
    await protect(req, res, next);

    expect(req.user).toEqual({ id: 7, role: "doctor" });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
