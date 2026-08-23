// backend/tests/integration/auth.test.js
// Tests d'intégration bout en bout (Express -> service -> MySQL réel),
// contre la base mediconnect_test chargée avec database/seed.sql.
// Voir docs/PLAN_DE_TESTS.md.

const request = require("supertest");

const { app, pool } = require("./testDb");

const SEEDED_PATIENT = {
  email: "nadia.ferreira@integration-test.local",
  password: "PatientTest123!",
};

afterAll(async () => {
  await pool.end();
});

describe("POST /api/auth/register", () => {
  it("crée un compte patient valide", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        firstname: "Test",
        lastname: "Intégration",
        email: `patient.register.${Date.now()}@integration-test.local`,
        role: "patient",
        password: "MotDePasse123!",
        confirmPassword: "MotDePasse123!",
        consent: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.role).toBe("patient");
  });

  // Escalade de privilège : l'inscription publique ne doit jamais pouvoir
  // créer un compte administrateur, quelle que soit la valeur envoyée.
  it("refuse la création d'un compte avec le rôle admin", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        firstname: "Faux",
        lastname: "Admin",
        email: `faux.admin.${Date.now()}@integration-test.local`,
        role: "ADMIN",
        password: "MotDePasse123!",
        confirmPassword: "MotDePasse123!",
        consent: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/type de compte/i);
  });
});

describe("POST /api/auth/login", () => {
  it("connecte un utilisateur avec des identifiants valides", async () => {
    const response = await request(app).post("/api/auth/login").send(SEEDED_PATIENT);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(SEEDED_PATIENT.email);
  });

  it("refuse un mot de passe incorrect", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: SEEDED_PATIENT.email, password: "mauvais-mot-de-passe" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // Injection SQL : le pool mysql2 utilise des requêtes paramétrées, la
  // tentative doit donc échouer proprement (401), jamais planter (500)
  // ni réussir à contourner l'authentification.
  it("échoue proprement face à une tentative d'injection SQL sur l'e-mail", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "' OR 1=1 --", password: "peu importe" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("GET /api/auth/me", () => {
  it("refuse l'accès sans token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });
});
