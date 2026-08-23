// backend/tests/integration/testDb.js
// Point d'entrée commun aux tests d'intégration : charge backend/.env.test
// (jamais backend/.env) et refuse de démarrer si DB_NAME ne désigne pas
// clairement une base de test. Les tests d'intégration exécutent de vraies
// requêtes SQL (inscriptions, rendez-vous, suspension de compte...) : les
// lancer par erreur sur la base de développement mélangerait des données
// de test à de vraies données, comme cela s'est déjà produit sur ce projet
// avec un compte administrateur réel supprimé par erreur (voir le
// CHANGELOG). Voir docs/PLAN_DE_TESTS.md pour la procédure de création de
// mediconnect_test.

const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test") });

const dbName = process.env.DB_NAME || "";

if (dbName !== "mediconnect_test") {
  throw new Error(
    `Tests d'intégration refusés : DB_NAME="${dbName}" (attendu : "mediconnect_test"). ` +
      "Copiez backend/.env.test.example en backend/.env.test et suivez la procédure de " +
      "docs/PLAN_DE_TESTS.md avant de lancer ces tests.",
  );
}

const app = require("../../app");
const { pool } = require("../../config/database");

module.exports = { app, pool };
