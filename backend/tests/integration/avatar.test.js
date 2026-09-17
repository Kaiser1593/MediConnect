// backend/tests/integration/avatar.test.js
// Tests d'intégration de l'envoi de photo de profil (multer, écriture
// réelle sur le disque). Voir docs/PLAN_DE_TESTS.md et
// backend/middleware/uploadMiddleware.js pour un piège multer déjà
// rencontré et corrigé pendant le développement de cette fonctionnalité
// (rejeter un fichier via une erreur de fileFilter, plutôt que via
// callback(null, false), bloque la requête au lieu de répondre 400).

const path = require("path");
const fs = require("fs/promises");

const request = require("supertest");

const { app, pool } = require("./testDb");
const { AVATARS_DIR } = require("../../middleware/uploadMiddleware");

// PNG 1x1 transparent valide, le plus petit fichier possible qui passe
// réellement par le pipeline multer (pas un buffer arbitraire) : le but
// est de vérifier l'écriture sur disque et le type MIME, pas le contenu.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const registerPatient = async () => {
  const email = `avatar.${Date.now()}.${Math.floor(Math.random() * 10000)}@integration-test.local`;

  const response = await request(app).post("/api/auth/register").send({
    firstname: "Avatar",
    lastname: "Test",
    email,
    role: "patient",
    password: "MotDePasse123!",
    confirmPassword: "MotDePasse123!",
    consent: true,
  });

  return response.body.token;
};

// Fichiers créés par ce test, supprimés en afterAll : la génération d'un
// nom aléatoire par upload (voir uploadMiddleware) empêche de les cibler
// autrement qu'en gardant la liste au fil des envois.
const uploadedFilenames = [];

afterAll(async () => {
  await Promise.all(
    uploadedFilenames.map((filename) =>
      fs.unlink(path.join(AVATARS_DIR, filename)).catch(() => {}),
    ),
  );
  await pool.end();
});

describe("POST /api/auth/me/avatar", () => {
  it("accepte une image valide, l'écrit sur le disque et la reflète sur /me", async () => {
    const token = await registerPatient();

    const uploadResponse = await request(app)
      .post("/api/auth/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", TINY_PNG, "avatar.png");

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    uploadedFilenames.push(path.basename(uploadResponse.body.avatarUrl));

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meResponse.body.user.avatar_url).toBe(uploadResponse.body.avatarUrl);
  });

  // Le fileFilter rejette silencieusement (callback(null, false)) : la
  // requête doit se terminer par un 400 propre, jamais rester bloquée
  // (voir le commentaire de uploadMiddleware.fileFilter).
  it("rejette un fichier qui n'est pas une image", async () => {
    const token = await registerPatient();

    const response = await request(app)
      .post("/api/auth/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", Buffer.from("pas une image"), {
        filename: "avatar.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("refuse l'envoi sans authentification", async () => {
    const response = await request(app)
      .post("/api/auth/me/avatar")
      .attach("avatar", TINY_PNG, "avatar.png");

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/auth/me/avatar", () => {
  it("supprime la photo de profil et le fichier associé", async () => {
    const token = await registerPatient();

    const uploadResponse = await request(app)
      .post("/api/auth/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", TINY_PNG, "avatar.png");

    const filename = path.basename(uploadResponse.body.avatarUrl);

    const deleteResponse = await request(app)
      .delete("/api/auth/me/avatar")
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meResponse.body.user.avatar_url).toBeNull();

    // deleteAvatar supprime déjà le fichier lui-même : vérifie qu'il n'y
    // a plus rien à nettoyer côté afterAll pour celui-ci.
    await expect(fs.access(path.join(AVATARS_DIR, filename))).rejects.toThrow();
  });
});

describe("DELETE /api/admin/users/:id (purge d'un compte avec avatar)", () => {
  // Trouvé en testant manuellement le parcours complet de l'application :
  // la suppression définitive d'un compte par un administrateur
  // (adminController.deleteUser, purge réelle — voir docs/RGPD.md)
  // supprimait la ligne utilisateurs mais jamais le fichier de photo de
  // profil associé, qui restait orphelin dans backend/uploads/avatars/.
  it("supprime aussi le fichier de photo de profil de l'utilisateur purgé", async () => {
    const token = await registerPatient();

    const uploadResponse = await request(app)
      .post("/api/auth/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", TINY_PNG, "avatar.png");

    const filename = path.basename(uploadResponse.body.avatarUrl);

    const meResponse = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    const userId = meResponse.body.user.id;

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin.test@integration-test.local",
      password: "AdminTest123!",
    });

    const deleteResponse = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    expect(deleteResponse.status).toBe(200);
    await expect(fs.access(path.join(AVATARS_DIR, filename))).rejects.toThrow();
  });
});
