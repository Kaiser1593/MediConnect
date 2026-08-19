// backend/tests/hashPassword.test.js
// Fonctions pures : aucun serveur ni base de données requis.

const { hashPassword, comparePassword } = require("../utils/hashPassword");

describe("hashPassword / comparePassword", () => {
  it("produit un hash différent du mot de passe en clair", async () => {
    const hash = await hashPassword("MotDePasse123");

    expect(hash).not.toBe("MotDePasse123");
  });

  it("comparePassword renvoie vrai pour le bon mot de passe, faux sinon", async () => {
    const hash = await hashPassword("MotDePasse123");

    await expect(comparePassword("MotDePasse123", hash)).resolves.toBe(true);
    await expect(comparePassword("MauvaisMotDePasse", hash)).resolves.toBe(
      false,
    );
  });

  it("deux hachages du même mot de passe donnent deux résultats différents (le sel)", async () => {
    const hash1 = await hashPassword("MotDePasse123");
    const hash2 = await hashPassword("MotDePasse123");

    expect(hash1).not.toBe(hash2);
  });
});
