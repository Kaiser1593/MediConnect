# Périmètre : architecture cible vs architecture implémentée

Le dossier de projet contient des diagrammes (composants et déploiement)
qui décrivent une architecture cible ambitieuse : microservices, Redis,
Elasticsearch, MinIO, un Nginx en répartiteur de charge devant un cluster
Node, une supervision Prometheus/Grafana/ELK, et un stockage S3. Le code
livré est un monolithe à trois couches (routes → contrôleurs → services →
modèles) sur une seule instance. Ce document assume cet écart, brique par
brique, plutôt que de le dissimuler — un jury qui compare le dossier au
code doit trouver ici la réponse avant de la demander à l'oral.

## Ce qui est réellement implémenté

- **Backend** : Node.js / Express 5, architecture en couches, une seule
  instance de processus.
- **Base de données** : MySQL 8.4, schéma relationnel unique
  (`database/mediconnect.sql`).
- **Cache / NoSQL** : Redis, pour le cache des disponibilités publiques et
  la liste noire des tokens JWT révoqués (voir `docs/ECOCONCEPTION.md`).
  L'application fonctionne en mode dégradé si Redis est indisponible :
  ce n'est jamais une dépendance bloquante.
- **Frontend** : React 19 / Vite, servi soit par le serveur de
  développement Vite, soit (en production/Docker) par Nginx comme simple
  serveur de fichiers statiques compilés.
- **Conteneurisation** : `docker-compose.yml` avec 4 services (`mysql`,
  `redis`, `backend`, `frontend`), healthchecks, volume de persistance
  MySQL.
- **CI** : GitHub Actions (`.github/workflows/ci.yml`) — lint, tests,
  build.

## Brique par brique : cible vs réel

| Brique cible (diagrammes) | Statut | Point d'extension prévu |
|---|---|---|
| Microservices (auth, rendez-vous, notifications séparés) | Non implémenté — monolithe modulaire | Les services (`backend/services/*.js`) sont déjà découpés par domaine métier et sans dépendance circulaire ; extraire un service en microservice reviendrait à l'exposer derrière sa propre API HTTP, sans réécrire sa logique interne. |
| Nginx en répartiteur de charge devant un cluster Node | Nginx présent, mais comme serveur de fichiers statiques uniquement (`frontend/Dockerfile`), pas de cluster backend | `backend/server.js` est sans état (JWT, pas de session en mémoire) : plusieurs instances derrière un Nginx en mode `upstream` fonctionneraient sans changement de code applicatif. |
| Elasticsearch (recherche médecins) | Non implémenté — recherche `LIKE` MySQL avec index | Le volume de données (annuaire de médecins) ne justifie pas Elasticsearch à cette échelle ; `doctorModel.searchPublic` est isolé dans le modèle, remplaçable sans toucher au contrôleur ni au frontend. |
| MinIO / S3 (stockage de fichiers) | Non implémenté — aucun upload de fichier dans cette version | Voir `database/CHANGELOG.md` (section sur `uploadMiddleware.js`) : le point d'entrée (middleware `multer`) serait le premier composant à écrire, MinIO un simple changement de destination du stockage. |
| Prometheus / Grafana / ELK (supervision) | Non implémenté | `journaux_securite` (MySQL) fait déjà office de journal d'audit applicatif ; une stack de supervision infrastructure viendrait en complément, pas en remplacement. |
| Redis (cache, files de messages) | **Implémenté partiellement** : cache + liste noire JWT, pas de file de messages | File de messages (ex. notifications asynchrones) : `notificationService.js` est déjà le point d'entrée unique des notifications, migrable vers une file Redis (pub/sub ou liste) sans changer son interface publique. |

## Pourquoi ce choix de périmètre

Le référentiel évalue une compétence de conception d'architecture cible
(les diagrammes) et une compétence de réalisation (le code qui tourne).
Le choix assumé ici est de livrer un périmètre réduit mais **entièrement
fonctionnel et testé**, plutôt que de multiplier les briques techniques
non maîtrisées pour "coller" aux diagrammes — ce que le dossier
lui-même interdit explicitement (voir `database/CHANGELOG.md`, section
sur les évolutions post-conception). Chaque divergence listée ci-dessus a
un point d'extension concret, pas un simple "à faire plus tard".
