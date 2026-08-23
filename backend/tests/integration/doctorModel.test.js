// backend/tests/integration/doctorModel.test.js
// Test d'intégration d'un modèle d'accès aux données (SQL réel, pas de
// mock), contre la base mediconnect_test et son jeu d'essai
// (database/seed.sql : voir docs/PLAN_DE_TESTS.md).

const { pool } = require("./testDb");
const doctorModel = require("../../models/doctorModel");

afterAll(async () => {
  await pool.end();
});

describe("doctorModel.getPublicById", () => {
  it("renvoie la fiche publique d'un médecin validé du jeu d'essai", async () => {
    const doctor = await doctorModel.getPublicById(1);

    expect(doctor).toMatchObject({
      doctor_id: 1,
      full_name: "Dr Amandine Corre",
      specialty: "Médecine générale",
      city: "Paris",
      slot_duration: 30,
    });
  });

  it("renvoie null pour un médecin inexistant", async () => {
    expect(await doctorModel.getPublicById(999999)).toBeNull();
  });
});

describe("doctorModel.getWeeklyAvailabilities", () => {
  it("renvoie les 10 créneaux récurrents du jeu d'essai (5 jours x 2 plages)", async () => {
    const availabilities = await doctorModel.getWeeklyAvailabilities(1);

    expect(availabilities).toHaveLength(10);
    expect(availabilities.every((slot) => slot.weekday >= 1 && slot.weekday <= 5)).toBe(true);
    expect(availabilities.map((slot) => slot.start_time)).toEqual(
      expect.arrayContaining(["09:00:00", "14:00:00"]),
    );
  });

  it("ne renvoie rien pour un médecin sans disponibilité déclarée", async () => {
    expect(await doctorModel.getWeeklyAvailabilities(999999)).toEqual([]);
  });
});

describe("doctorModel.findByUserId", () => {
  it("résout la fiche médecin à partir de l'identifiant utilisateur, spécialité incluse", async () => {
    // utilisateur_id 5 = Amandine Corre (medecins.id 1) dans le jeu d'essai.
    const doctor = await doctorModel.findByUserId(5);

    // est_valide est un BOOLEAN MySQL (TINYINT(1) en interne) : mysql2 le
    // renvoie tel quel comme nombre (1), sans conversion automatique en
    // booléen JavaScript.
    expect(doctor).toMatchObject({
      id: 1,
      is_approved: 1,
      specialty_id: 1,
    });
  });
});
