// backend/tests/integration/appointments.test.js
// Tests d'intégration contre la base mediconnect_test (voir testDb.js et
// docs/PLAN_DE_TESTS.md). Utilise le médecin #1 du jeu d'essai
// (database/seed.sql : Dr Amandine Corre, Médecine générale, validé,
// disponible lundi-vendredi 9h-12h et 14h-17h).

const request = require("supertest");

const { app, pool } = require("./testDb");

const SEEDED_DOCTOR_ID = 1;

// Un lundi dans le futur : toujours dans les disponibilités du jeu
// d'essai, jamais "aujourd'hui" (évite l'exclusion des créneaux déjà
// passés dans computeAvailableSlots). Formatage manuel des composants
// locaux plutôt que toISOString() : cette dernière convertit en UTC et
// peut faire retomber la date sur la veille selon le fuseau de la
// machine (le même piège que documente appointmentService.getIsoWeekday).
const nextMonday = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const isoWeekday = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() + ((1 - isoWeekday + 7) % 7));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SCHEDULED_ON = nextMonday();

const registerPatient = async (label) => {
  const email = `${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@integration-test.local`;

  const response = await request(app).post("/api/auth/register").send({
    firstname: "Patient",
    lastname: label,
    email,
    role: "patient",
    password: "MotDePasse123!",
    confirmPassword: "MotDePasse123!",
    consent: true,
  });

  return response.body.token;
};

let tokenA;
let tokenB;

beforeAll(async () => {
  tokenA = await registerPatient("A");
  tokenB = await registerPatient("B");
});

// Nettoie les rendez-vous créés par ce fichier : sans ça, relancer la
// suite une seconde fois sur la même base locale (le lundi ciblé ne
// change pas d'une exécution à l'autre dans la même semaine) ferait
// échouer la réservation initiale, déjà prise par la précédente exécution.
afterAll(async () => {
  await pool.query(
    "DELETE FROM rendez_vous WHERE medecin_id = ? AND date_rdv = ? AND heure_debut IN ('09:00:00', '09:30:00', '10:00:00')",
    [SEEDED_DOCTOR_ID, SCHEDULED_ON],
  );
  await pool.end();
});

describe("POST /api/appointments", () => {
  it("crée un rendez-vous sur un créneau disponible", async () => {
    const response = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        doctorId: SEEDED_DOCTOR_ID,
        scheduledOn: SCHEDULED_ON,
        startTime: "09:00",
        reason: "Consultation de test",
      });

    expect(response.status).toBe(201);
    expect(response.body.appointment.status).toBe("pending");
  });

  // Contrainte UNIQUE (medecin_id, date_rdv, heure_debut), doublée d'une
  // vérification applicative des créneaux disponibles : la double
  // réservation doit échouer proprement, jamais réussir ni planter.
  it("refuse une double réservation sur le même créneau", async () => {
    const response = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        doctorId: SEEDED_DOCTOR_ID,
        scheduledOn: SCHEDULED_ON,
        startTime: "09:00",
        reason: "Tentative de double réservation",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});

describe("PATCH /api/appointments/:id/cancel", () => {
  it("permet au patient d'annuler son propre rendez-vous", async () => {
    const created = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        doctorId: SEEDED_DOCTOR_ID,
        scheduledOn: SCHEDULED_ON,
        startTime: "09:30",
        reason: "RDV à annuler",
      });

    const response = await request(app)
      .patch(`/api/appointments/${created.body.appointment.id}/cancel`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Accès horizontal : un patient ne peut pas agir sur le rendez-vous
  // d'un autre patient, même en devinant/énumérant son identifiant.
  it("refuse à un patient d'annuler le rendez-vous d'un autre patient", async () => {
    const created = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        doctorId: SEEDED_DOCTOR_ID,
        scheduledOn: SCHEDULED_ON,
        startTime: "10:00",
        reason: "RDV appartenant au patient A",
      });

    const response = await request(app)
      .patch(`/api/appointments/${created.body.appointment.id}/cancel`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
