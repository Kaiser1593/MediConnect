const js = require("@eslint/js");
const globals = require("globals");
const jestPlugin = require("eslint-plugin-jest");
const { defineConfig, globalIgnores } = require("eslint/config");

module.exports = defineConfig([
  globalIgnores(["coverage", "node_modules"]),
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
    rules: {
      // Express reconnaît un middleware d'erreur à son arité (4 paramètres) :
      // errorMiddleware.js doit déclarer "next" même sans l'appeler.
      "no-unused-vars": ["error", { argsIgnorePattern: "^next$" }],
    },
  },
  {
    files: ["tests/**/*.js"],
    extends: [jestPlugin.configs["flat/recommended"]],
  },
]);
