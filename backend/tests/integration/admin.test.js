// backend/tests/integration/admin.test.js
// Tests d'intégration contre la base mediconnect_test (voir testDb.js et
// docs/PLAN_DE_TESTS.md). Utilise le compte administrateur du jeu
// d'essai (database/seed.sql).

const request = require("supertest");

const { app, pool } = require("./testDb");

const SEEDED_ADMIN = {
  email: "admin.test@integration-test.local",
  password: "AdminTest123!",
};

let adminToken;
let patientToken;
let patientId;
let patientEmail;

beforeAll(async () => {
  const adminLogin = await request(app).post("/api/auth/login").send(SEEDED_ADMIN);
  adminToken = adminLogin.body.token;

  patientEmail = `patient.admin-test.${Date.now()}@integration-test.local`;
  const registration = await request(app).post("/api/auth/register").send({
    firstname: "Patient",
    lastname: "Suspendu",
    email: patientEmail,
    role: "patient",
    password: "MotDePasse123!",
    confirmPassword: "MotDePasse123!",
    consent: true,
  });

  patientId = registration.body.user.id;

  const patientLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: patientEmail, password: "MotDePasse123!" });
  patientToken = patientLogin.body.token;
});

afterAll(async () => {
  await pool.end();
});

describe("Accès réservé aux administrateurs", () => {
  it("refuse à un patient l'accès aux statistiques d'administration", async () => {
    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});

describe("PATCH /api/admin/users/:id/status", () => {
  it("permet à un administrateur de suspendre un compte", async () => {
    const response = await request(app)
      .patch(`/api/admin/users/${patientId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ is_active: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Le compte suspendu ne doit plus pouvoir se connecter...
    const loginAttempt = await request(app)
      .post("/api/auth/login")
      .send({ email: patientEmail, password: "MotDePasse123!" });

    expect(loginAttempt.status).toBe(403);

    // ...et l'état est bien reflété en base pour la session déjà ouverte
    // (token émis avant la suspension, toujours valide jusqu'à expiration).
    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.is_active).toBe(false);
  });
});

describe("GET /api/admin/logs", () => {
  it("renvoie les journaux de sécurité à un administrateur", async () => {
    const response = await request(app)
      .get("/api/admin/logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.logs)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });
});
