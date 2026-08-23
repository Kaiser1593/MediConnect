# Déploiement

## Prérequis

- Node.js 22
- MySQL 8.4 (ou compatible 8.x)
- Redis 7 (optionnel — l'application démarre et fonctionne sans, en mode
  dégradé : pas de cache, tokens jamais mis en liste noire)
- Docker Desktop + Docker Compose, pour le déploiement conteneurisé

## Variables d'environnement

### `backend/.env` (développement local, hors Docker)

| Variable | Rôle |
|---|---|
| `PORT` | Port d'écoute de l'API (5000 par défaut) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Connexion MySQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Signature et durée de vie des tokens |
| `REDIS_HOST`, `REDIS_PORT` | Optionnels — absence = mode dégradé |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Envoi d'e-mails (réinitialisation de mot de passe) |
| `FRONTEND_URL` | Base des liens envoyés par e-mail |

Voir `backend/.env.example` pour le gabarit complet, jamais commité avec
de vraies valeurs (`.gitignore`).

### `.env` racine (Docker Compose uniquement)

Variables injectées dans les conteneurs : `DB_NAME`, `DB_PASSWORD`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `SMTP_*`, `FRONTEND_URL` (à `http://localhost:8080`
en local, le port du service `frontend`). Voir `.env.example` à la racine.
`REDIS_HOST`/`REDIS_PORT` ne sont **pas** à renseigner ici : fixés en dur
dans `docker-compose.yml` (nom du service Docker `redis`, port `6379`),
car internes au réseau Docker, pas des secrets.

## Initialisation de la base de données

**Nouvelle installation** : `database/mediconnect.sql` contient le schéma
complet (français, conforme à l'Annexe B) prêt à l'emploi :

```
mysql -u root -p < database/mediconnect.sql
```

En Docker, ce fichier est monté sur `/docker-entrypoint-initdb.d/` et
s'exécute automatiquement au tout premier démarrage du conteneur MySQL
(uniquement si son volume est vide — voir "Rollback" plus bas).

**Base existante à faire migrer** (schéma anglais vers français) :
`database/migration_french_rename.sql`, en place, sans perte de données
(voir `database/CHANGELOG.md` pour la méthode).

## Sauvegarde et restauration

Procédure standard `mysqldump` / réimport, utilisée en pratique au cours
du développement (restauration réelle d'un compte supprimé par erreur,
voir `database/CHANGELOG.md`) : elle n'est pas seulement documentée, elle
a déjà servi.

**Sauvegarde complète** (schéma + données), avant toute migration ou
opération risquée sur la base :

```bash
mysqldump -u root -p --single-transaction --routines --triggers \
  mediconnect > sauvegardes/mediconnect_$(date +%Y%m%d_%H%M%S).sql
```

- `--single-transaction` : cohérence de la sauvegarde sans verrouiller les
  tables (moteur InnoDB), important si l'application reste en ligne
  pendant la sauvegarde.
- `--routines --triggers` : inclut la vue `v_medecins_public` et tout
  déclencheur éventuel, pas seulement les tables.
- Nommer le fichier avec un horodatage : plusieurs sauvegardes doivent
  pouvoir coexister sans s'écraser.

**Restauration complète**, sur une base vide ou après un incident :

```bash
mysql -u root -p mediconnect < sauvegardes/mediconnect_20260101_120000.sql
```

Si la base cible contient encore des données partielles ou corrompues,
la recréer d'abord à vide (`DROP DATABASE mediconnect; CREATE DATABASE
mediconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`) avant de
réimporter — un `mysqldump` sans `--no-create-info` ne supprime pas les
tables existantes de lui-même, il les recrée si absentes mais échoue sur
un `CREATE TABLE` en conflit avec des données déjà présentes.

**Restauration ciblée** (un seul compte ou une poignée de lignes, sans
tout réimporter) : retrouver la ligne concernée dans le fichier de
sauvegarde le plus récent (recherche du `INSERT INTO utilisateurs`
correspondant à l'identifiant ou l'e-mail visé) et la réinsérer
manuellement, plutôt que d'écraser toute la base pour une perte
localisée — c'est cette méthode qui a permis de restaurer un compte
administrateur supprimé par erreur en cours de développement, à partir
d'un `mysqldump` antérieur, sans perdre les données créées entre-temps.

**Fréquence recommandée en production** (non déployée dans le cadre de ce
projet, voir "Environnements" plus bas) : sauvegarde quotidienne
automatisée (cron + `mysqldump`) avec rétention d'au moins 7 jours, et
sauvegarde manuelle systématique immédiatement avant toute migration de
schéma.

## Build frontend

```
cd frontend
npm ci
npm run build
```

Produit `frontend/dist/`, un ensemble de fichiers statiques (HTML, JS
découpé en chunks par route grâce au lazy loading — voir
`docs/ECOCONCEPTION.md`, CSS). En Docker, cette étape est intégrée au
`frontend/Dockerfile` (étape de build multi-stage, servie ensuite par
Nginx).

## Lancement en développement (sans Docker)

```
# Backend
cd backend && npm ci && npm run dev

# Frontend
cd frontend && npm ci && npm run dev
```

Le backend écoute sur `5000`, le frontend Vite sur `5173` (ou le port
suivant disponible si occupé — voir la liste CORS dans `backend/app.js`,
qui autorise explicitement `5173` et `5174`).

## Lancement avec Docker

```
docker compose up -d --build
```

Démarre 4 conteneurs : `mysql` (8.4, healthcheck, volume de persistance
`mysql_data`), `redis` (7, healthcheck), `backend` (attend que `mysql` et
`redis` soient sains avant de démarrer, volume `backend_uploads` pour les
photos de profil uploadées — sans lui, un redémarrage du conteneur les
perdrait), `frontend` (Nginx, port `8080`). Démarrage complet,
inscription, connexion, envoi d'e-mail SMTP et révocation de token via
Redis vérifiés en conditions réelles dans les conteneurs. L'envoi de
photo de profil, ajouté ensuite, a été vérifié en dehors de Docker
(serveur Node local contre une vraie base MySQL) mais pas encore
spécifiquement rejoué dans les conteneurs — à revérifier avant la
présentation, même si le mécanisme (écriture disque + volume nommé) ne
dépend d'aucune spécificité Docker.

```
docker compose down        # arrête et retire les conteneurs, garde le volume MySQL
docker compose down -v     # + supprime le volume (perte des données Docker)
```

**Port 5000 partagé** : le serveur de développement local et le conteneur
`backend` se disputent le même port. Ne pas lancer les deux en même
temps.

## Rollback

- **Application** (backend/frontend) : `git checkout <commit précédent>`
  puis `docker compose up -d --build` (ou redéploiement de l'image
  précédente si un registre est utilisé). Aucune migration de code
  irréversible dans cette version.
- **Base de données** : avant toute migration de schéma en production,
  sauvegarde complète (`mysqldump`), comme fait avant
  `migration_french_rename.sql` en développement. En cas d'échec, restauration
  de la sauvegarde (`mysql < sauvegarde.sql`) avant de corriger et
  rejouer la migration.
- **Volume Docker MySQL périmé** : un volume déjà initialisé ne rejoue
  jamais `mediconnect.sql` automatiquement (comportement MySQL standard).
  Si le schéma applicatif a changé, `docker compose down -v` puis `up`
  recrée un volume vierge qui rechargera le schéma à jour — implique une
  perte des données de ce conteneur (jamais utilisé pour des données de
  production réelles dans cette version du projet).

## Environnements

| Caractéristique | **dev** | **test** | **prod** |
|---|---|---|---|
| Objectif | Développement au quotidien | Intégration continue, tests d'intégration Supertest, vérification fonctionnelle manuelle | Non déployé dans le cadre de ce projet |
| Base de données | MySQL locale, données de travail réelles (comptes créés manuellement au fil du développement) | `mediconnect_test`, isolée (garde-fou dans `backend/tests/integration/testDb.js`), chargée avec `database/mediconnect.sql` + `database/seed.sql` ; comptes jetables supprimés après chaque vérification manuelle | Nécessiterait un hébergement HDS (données de santé, voir `docs/RGPD.md`) |
| Hébergement | Poste de développement | Poste de développement (`docker-compose.test.yml` ou MySQL locale dédiée) ; conteneur MySQL éphémère en CI | Hors périmètre — HTTPS réel, nom de domaine, hébergeur HDS à prévoir |
| Secrets | `backend/.env`, non versionné (`.gitignore`) | `backend/.env.test`, non versionné ; injectés directement dans l'environnement du job en CI | Hors périmètre — gestionnaire de secrets dédié à prévoir (déjà anticipé : aucun secret n'est en dur dans le code) |
| Déclenchement | Manuel (`npm run dev`) | Automatique à chaque push/pull request (CI) ; manuel en local avant un commit sensible | — |

## Recette

Procédure de recette : rejouer manuellement les scénarios ci-dessous
avant toute présentation ou mise en production, en complément (jamais en
remplacement) de la suite automatisée `npm test` (voir
`docs/PLAN_DE_TESTS.md`). Chaque scénario a un critère d'acceptation
binaire (passe / ne passe pas) et un responsable de validation — sur ce
projet à développeur unique, le développeur lui-même, agissant comme
testeur indépendant du code qu'il vient d'écrire (rejeu à froid, sans
relire le code en même temps).

| # | Scénario | Critère d'acceptation | Couverture automatisée | Responsable |
|---|---|---|---|---|
| T01 | Inscription d'un patient (formulaire complet, consentement RGPD coché) | Compte créé, connexion immédiate possible, refus clair si le consentement n'est pas coché | `auth.test.js` (partiel) + vérification manuelle du formulaire | Développeur |
| T02 | Inscription d'un médecin, compte en attente, validation par un administrateur | Le médecin n'apparaît pas dans la recherche publique avant validation ; apparaît immédiatement après | Vérification manuelle (voir `docs/JEU_ESSAI.md`) | Développeur |
| T03 | Connexion avec identifiants invalides, puis valides | Message d'erreur identique que l'e-mail existe ou non ; connexion réussie ensuite | `auth.test.js`, `Login.test.jsx` | Développeur |
| T04 | Recherche d'un médecin par spécialité puis réservation d'un créneau libre | Créneau réservé au statut `pending`, visible dans "Mes rendez-vous" | `appointments.test.js`, `AppointmentBooking.test.jsx`, `docs/JEU_ESSAI.md` (cas 1) | Développeur |
| T05 | **Double réservation sur le même créneau** (scénario prioritaire) | La seconde tentative est refusée (409), aucune donnée corrompue | `appointments.test.js`, `docs/JEU_ESSAI.md` (cas 2) | Développeur |
| T06 | Confirmation puis annulation d'un rendez-vous par le médecin | Statut mis à jour, notification créée pour le patient | `docs/JEU_ESSAI.md` (cas 3) + vérification manuelle de l'annulation | Développeur |
| T07 | Dépôt d'un avis après une consultation terminée | Avis enregistré, note moyenne du médecin recalculée | Vérification manuelle | Développeur |
| T08 | Suspension puis réactivation d'un compte par un administrateur | Le compte suspendu ne peut plus se connecter (403) ; réactivé, la connexion refonctionne | `admin.test.js` (suspension) + vérification manuelle (réactivation) | Développeur |
| T09 | Export des données personnelles puis suppression de compte (droits RGPD) | Fichier JSON téléchargé avec les données réelles ; après suppression, connexion impossible et données anonymisées en base | Vérification manuelle (voir `docs/RGPD.md`) | Développeur |
| T10 | Fonctionnement en mode dégradé (Redis arrêté) | L'application démarre et reste utilisable (réservation, connexion) sans cache ni liste noire de tokens, sans erreur visible côté utilisateur | `cacheService.test.js` (mode dégradé) + vérification manuelle Redis arrêté | Développeur |

Ces dix scénarios couvrent le parcours principal démontré (inscription,
recherche, réservation, administration, RGPD, résilience) ; ils ne
prétendent pas reproduire mot pour mot une numérotation du dossier figé,
mais forment le plan de recette réel de cette version du code.
