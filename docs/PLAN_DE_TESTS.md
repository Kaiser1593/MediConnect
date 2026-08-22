# Plan de tests

## Périmètre

Couvre l'ensemble des fonctionnalités retenues : authentification
(inscription, connexion, mot de passe oublié, changement de mot de
passe, déconnexion), recherche et réservation de rendez-vous, gestion des
disponibilités, actions administrateur (validation médecin, suspension de
compte, journaux de sécurité), avis, notifications, droits RGPD (export,
suppression).

## Niveaux de test

| Niveau | Méthode | Outil |
|---|---|---|
| Unitaire | Automatisé, exécuté à chaque modification (`npm test`) et en CI | Jest |
| Intégration / fonctionnel | Scripts de vérification HTTP contre l'API réelle, avec comptes jetables créés puis supprimés | Scripts Node ad hoc (`fetch`), voir "Jeu d'essai" ci-dessous |
| Sécurité | Contrôles manuels ciblés (rejet de rôle non autorisé, double réservation, token révoqué, `npm audit`) | Scripts HTTP + `npm audit` |

**Choix assumé** : les tests unitaires sont automatisés et rejoués à
chaque modification (Jest + CI). Les tests fonctionnels/intégration sont
menés par des scripts HTTP reproductibles contre l'environnement de
développement, exécutés manuellement à chaque évolution du périmètre
qu'ils couvrent, plutôt que par une suite Supertest permanente — un choix
de temps de développement, pas une impossibilité technique : l'API étant
déjà découpée en couches testables, l'ajout d'une suite Supertest
consisterait à rejouer ces mêmes scénarios sous Jest, sans changement
d'architecture.

## Environnement de test

- Base de données : instance MySQL de développement locale (même schéma
  que la production, `database/mediconnect.sql`), jamais la base de
  démonstration utilisée en soutenance.
- Comptes de test : convention `verif.<objet>.<horodatage>@mediconnect.local`,
  créés puis systématiquement supprimés après vérification (jamais de
  données de test laissées en base).
- Tests unitaires : aucune dépendance à une base réelle (mocks explicites
  sur `logger`, `config/database` non importé par les modules testés).

## Critères d'entrée / de sortie

- **Entrée** : le code compile (`npm run build` frontend), le serveur
  démarre (`npm run dev` / `node server.js`), aucune régression connue
  sur l'authentification ou la réservation.
- **Sortie** : `npm test` (backend) au vert, `npx eslint .` (frontend)
  sans erreur, scénario de double réservation revérifié à chaque
  modification touchant les rendez-vous ou la base de données.

## Matrice de couverture fonctionnalité × test

| Fonctionnalité | Unitaire (Jest) | Fonctionnel (scripts HTTP) |
|---|---|---|
| Hachage / vérification de mot de passe | ✅ `hashPassword.test.js` | — |
| Génération / vérification de JWT | ✅ `generateToken.test.js` | ✅ (via connexion) |
| Middleware d'authentification (`protect`) | ✅ `authMiddleware.test.js` | ✅ (routes protégées, token invalide/absent/révoqué) |
| Contrôle de rôle (`authorize`) | ✅ `roleMiddleware.test.js` | ✅ (accès refusé multi-rôles) |
| Inscription (whitelist de rôle, consentement) | — | ✅ (rôle `admin` rejeté, inscription sans consentement rejetée) |
| Connexion / brute force | — | ✅ (identifiants invalides, compte suspendu, rate limiting) |
| Réservation de rendez-vous | — | ✅ (voir `docs/JEU_ESSAI.md`) |
| **Double réservation (contrainte `UNIQUE`)** | — | ✅ — scénario détaillé dans `docs/JEU_ESSAI.md` |
| Confirmation / replanification / clôture | — | ✅ |
| Avis (création, note moyenne) | — | ✅ |
| Administration (validation médecin, suspension, journaux) | — | ✅ |
| Export / suppression RGPD | — | ✅ (export téléchargé, anonymisation vérifiée en base, token révoqué) |
| Cache Redis / mode dégradé | — | ✅ (testé avec et sans Redis démarré) |

## Résultats

- `npm test` : **11/11 tests unitaires passent** (4 suites), aucune
  régression sur l'ensemble de la session.
- `npm audit` (backend et frontend) : **0 vulnérabilité** au moment de la
  rédaction — deux vulnérabilités `high` ont été trouvées et corrigées en
  cours de session (voir `docs/VEILLE_SECURITE.md`).
- Scénario de double réservation : **systématiquement refusé (409)**, y
  compris après le renommage complet du schéma en français.
