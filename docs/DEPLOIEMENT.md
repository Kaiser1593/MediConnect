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
`redis` soient sains avant de démarrer), `frontend` (Nginx, port `8080`).
Vérifié en conditions réelles : démarrage complet, inscription, connexion,
envoi d'e-mail SMTP et révocation de token via Redis tous fonctionnels
dans les conteneurs.

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

| Environnement | Base de données | Objectif |
|---|---|---|
| **dev** | MySQL locale, données de travail réelles (comptes créés manuellement au fil du développement) | Développement au quotidien |
| **test** | Base isolée, jamais partagée avec dev — comptes jetables créés puis supprimés systématiquement après chaque vérification (voir `docs/PLAN_DE_TESTS.md`) ; CI : service MySQL éphémère, recréé à chaque exécution | Vérification fonctionnelle, intégration continue |
| **prod** | Non déployé dans le cadre de ce projet ; nécessiterait un hébergement HDS (voir `docs/RGPD.md`), du HTTPS réel, des secrets hors du dépôt (déjà le cas : `.env` non versionné) | — |
