// backend/tests/roleMiddleware.test.js
// req/res sont simulés (objets simples) : aucun serveur réel n'est démarré.
// logger est mocké pour ne pas dépendre d'une connexion MySQL.

jest.mock("../utils/logger", () => ({ logSecurityEvent: jest.fn() }));

const { authorize } = require("../middleware/roleMiddleware");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authorize", () => {
  it('authorize("admin") appelle next() si req.user.role === "admin"', () => {
    const req = {
      user: { id: 1, role: "admin" },
      originalUrl: "/api/admin/stats",
      ip: "127.0.0.1",
    };
    const res = buildRes();
    const next = jest.fn();

    authorize("admin")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('authorize("admin") renvoie 403 si le rôle est "patient"', () => {
    const req = {
      user: { id: 1, role: "patient" },
      originalUrl: "/api/admin/stats",
      ip: "127.0.0.1",
    };
    const res = buildRes();
    const next = jest.fn();

    authorize("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
