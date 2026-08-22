# Veille sécurité

Absent du dossier initial (voir `database/CHANGELOG.md`), exigé par le
référentiel dans le dossier, la présentation orale et l'entretien
technique.

## Vulnérabilités concrètes trouvées et corrigées

Deux audits `npm audit` distincts, menés au fil du développement (pas un
exercice ponctuel a posteriori), ont remonté des vulnérabilités réelles :

### Backend — `brace-expansion` (haute sévérité)

Remontée par `npm audit` après l'installation de `redis` et
`express-rate-limit`. Dépendance transitive d'un outil de développement
(pas du code applicatif exposé). CVE : déni de service par tableaux
intermédiaires non bornés (GHSA-rgw5-rvv9-x895).

**Correction** : `npm audit fix` (mise à jour non cassante). Vérifié
ensuite : `npm audit` → `found 0 vulnerabilities`, suite de tests
(`npm test`) toujours au vert.

### Frontend — trois vulnérabilités hautes

Remontées par `npm audit` en préparation de ce document :

| Paquet | Nature |
|---|---|
| `brace-expansion` | Même CVE que côté backend |
| `nanoid` | Boucle infinie possible avec un générateur personnalisé de taille zéro (GHSA-2v37-7h3g-55p8) |
| `react-router` (et `react-router-dom`, qui en dépend) | Contournement CSRF en mode RSC permettant l'exécution d'une action avant la réponse 400 attendue (GHSA-qwww-vcr4-c8h2) |

**Correction** : `npm audit fix`. Vérifié ensuite : `npm audit` →
`found 0 vulnerabilities`, `npx eslint .` sans erreur, `npm run build`
réussi, navigation testée en direct dans le navigateur (aucune régression
sur le routage après la mise à jour de `react-router-dom`).

## Méthode et sources de veille

- **`npm audit`** (backend et frontend) : exécuté à chaque ajout de
  dépendance, et systématiquement avant toute livraison. C'est la source
  qui a effectivement déclenché les deux corrections ci-dessus.
- **GitHub Security Advisories** (`github.com/advisories`) : référence
  citée par `npm audit` pour le détail de chaque CVE (nature exacte de la
  faille, versions affectées).
- **OWASP** (Top 10, notamment injection, contrôle d'accès cassé,
  mauvaise configuration de sécurité) : grille de lecture utilisée pour
  les choix d'architecture (requêtes paramétrées partout via `mysql2`,
  jamais de concaténation SQL ; contrôle de rôle serveur, jamais fait
  confiance au client ; Helmet pour les en-têtes HTTP).
- **ANSSI / CERT-FR** : source de référence française pour les alertes
  générales (dépendances Node.js, MySQL) ; pas d'alerte spécifique à ce
  projet trouvée à ce jour, mentionnée ici comme source de veille
  déclarée plutôt qu'omise.

## Fréquence de veille proposée

- `npm audit` : à chaque ajout/mise à jour de dépendance (déjà pratiqué),
  et au minimum une fois par mois même sans changement de dépendances
  (une CVE peut être publiée sur une version déjà installée).
- Mise à jour des dépendances majeures (Express, React, MySQL) : suivi
  trimestriel, hors urgence de sécurité.
- En cas de CVE critique publiée sur une dépendance directe : correction
  sous 48h, sur le modèle des deux corrections de ce document.
