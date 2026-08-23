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

## Modèle de domaine : cible et périmètre livré

Le diagramme de classes du dossier (page 13) décrit un domaine métier
plus large que celui réellement implémenté : au-delà de
`Utilisateur`/`Patient`/`Médecin`/`Administrateur`/`RendezVous`, présents
dans le code, il modélise `DossierMedical`, `Ordonnance`, `Paiement`
(avec les énumérations `MethodePaiement` et `StatutPaiement`), `Lieu`
(cabinet médical) et `PlageHoraire`. Ce tableau assume l'écart, entité
par entité, pour la même raison que la section précédente : c'est la
réponse à préparer si le jury pointe le diagramme.

| Entité cible | Statut | Raison de la non-implémentation | Point d'extension prévu |
|---|---|---|---|
| `DossierMedical` | Non implémenté | Un dossier médical persistant, distinct du compte rendu par consultation, suppose son propre modèle de droits d'accès (consentement du patient, accès en lecture/écriture du médecin, traçabilité) — un périmètre à part entière, au-delà de ce qu'exige la démonstration d'une plateforme de prise de rendez-vous | `rendez_vous.notes_medecin` (texte libre, visible du seul médecin) en est aujourd'hui le substitut minimal. Une table `dossiers_medicaux` (clé étrangère `patient_id`, plusieurs entrées horodatées, éventuellement liées à un `rendez_vous_id`) et un service dédié, séparé d'`appointmentService`, seraient le point de départ. |
| `Ordonnance` | Non implémenté | Une ordonnance structurée (médicaments, posologie, durée) suppose un référentiel de médicaments (codes DCI ou équivalent) : hors périmètre d'un projet de démonstration sans base médicamenteuse réelle | `notes_medecin` sert de substitut texte libre, comme pour `DossierMedical`. Cible réelle : une table `ordonnances` (`rendez_vous_id`) et `ordonnance_lignes` (médicament, posologie, durée) ; `backend/middleware/uploadMiddleware.js` existe déjà (photo de profil, voir plus bas) et gère déjà l'écriture sur disque + le service statique — la génération d'un PDF d'ordonnance en réutiliserait le même principe, pas la même instance (avatars et documents médicaux n'ont pas le même besoin de confidentialité). |
| `Paiement` (+ `MethodePaiement`, `StatutPaiement`) | Non implémenté | Aucun flux de paiement dans cette version — assumé explicitement à l'écran (`AppointmentBooking.jsx` : "Aucun paiement ne sera effectué lors de la réservation"). Un vrai paiement en ligne implique l'intégration d'un prestataire (Stripe, PayPal...) et des enjeux de conformité (PCI-DSS) hors périmètre pédagogique | `medecins.prix_consultation` existe déjà en base et servirait de montant source. Cible : une table `paiements` (`rendez_vous_id`, `montant`, `methode` ENUM, `statut` ENUM, référence externe du prestataire) et un `paymentService.js` encapsulant le SDK du prestataire, sans toucher à `appointmentService`. |
| `Lieu` (cabinet) | Non implémenté comme entité séparée | `medecins.adresse`/`ville`/`code_postal` sont des colonnes plates sur la fiche médecin : suffisant tant qu'un médecin n'exerce que dans un seul cabinet, ce qui couvre l'intégralité du parcours démontré | Extraire une table `cabinets` (adresse, ville, code postal, téléphone) et une relation `medecins.cabinet_id` (ou une table de liaison si plusieurs médecins partagent un secrétariat) permettrait de modéliser un médecin exerçant à plusieurs adresses, non démontré ici. |
| `PlageHoraire` | Absorbée dans `disponibilites` | Choix technique déjà assumé et détaillé dans `database/CHANGELOG.md` : un modèle de disponibilité récurrente par jour de semaine (`disponibilites.jour_semaine`) remplace des créneaux datés un par un, plus simple à déclarer pour un médecin et à maintenir en base | Aucune extension nécessaire : `disponibilites` couvre le même besoin fonctionnel que `PlageHoraire` sous un nom et une structure différents. |

**Fonctionnalité ajoutée au-delà du dossier** : la photo de profil (avatar
patient/médecin) a été développée intégralement — upload multipart
(`backend/middleware/uploadMiddleware.js`), stockage sur disque, affichage
dans la recherche de médecins, la réservation et les tableaux de bord.
Absente du dossier comme de l'Annexe B, documentée dans
`database/CHANGELOG.md` (section 8) pour la même raison que
`consentement_rgpd_le` : une fonctionnalité réelle ajoutée après la
conception initiale, pas un écart de conformité à justifier.

## Pourquoi ce choix de périmètre

Le référentiel évalue une compétence de conception d'architecture cible
(les diagrammes) et une compétence de réalisation (le code qui tourne).
Le choix assumé ici est de livrer un périmètre réduit mais **entièrement
fonctionnel et testé**, plutôt que de multiplier les briques techniques
non maîtrisées pour "coller" aux diagrammes — ce que le dossier
lui-même interdit explicitement (voir `database/CHANGELOG.md`, section
sur les évolutions post-conception). Chaque divergence listée ci-dessus a
un point d'extension concret, pas un simple "à faire plus tard".
