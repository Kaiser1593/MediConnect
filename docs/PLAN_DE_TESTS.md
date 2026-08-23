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
| Unitaire | Automatisé, exécuté à chaque modification (`npm test`) et en CI | Jest (mocks, aucune base réelle) |
| Intégration | Automatisé, exécuté à chaque modification (`npm test`) et en CI, contre une vraie base MySQL | Jest + Supertest, `backend/tests/integration/` |
| Fonctionnel manuel | Scripts de vérification HTTP contre l'API réelle, pour les scénarios non encore repris en Supertest (RGPD, avis, cache Redis...) | Scripts Node ad hoc (`fetch`), voir "Jeu d'essai" ci-dessous |
| Sécurité | Automatisé pour l'escalade de privilège, l'injection SQL et l'accès horizontal (voir `auth.test.js` / `appointments.test.js`) ; `npm audit` pour les dépendances | Jest + Supertest, `npm audit` |

**Suite d'intégration Supertest** (`backend/tests/integration/`) :

| Fichier | Scénarios couverts |
|---|---|
| `auth.test.js` | Inscription valide, escalade de privilège (rôle `admin` rejeté), connexion valide/invalide, injection SQL sur l'e-mail de connexion, accès à `/me` sans token |
| `appointments.test.js` | Réservation sur un créneau disponible, double réservation refusée (contrainte `UNIQUE`), annulation par son propriétaire, accès horizontal refusé (annulation du rendez-vous d'un autre patient) |
| `admin.test.js` | Accès refusé à un patient sur les routes d'administration, suspension de compte par un administrateur, lecture des journaux de sécurité |
| `doctorModel.test.js` | Modèle d'accès aux données (`doctorModel`) exécuté contre le jeu d'essai réel : fiche publique d'un médecin validé, disponibilités hebdomadaires, résolution par identifiant utilisateur |
| `avatar.test.js` | Envoi réel d'une photo de profil (écriture sur disque, multer), reflet sur `/auth/me`, rejet d'un fichier non image, accès refusé sans authentification, suppression avec nettoyage du fichier |

Ces tests s'exécutent contre une vraie base MySQL (`mediconnect_test`,
voir ci-dessous), au travers de la pile complète (Express → service →
modèle → MySQL), pas de mocks : c'est ce qui distingue cette suite des
tests unitaires existants. Les scénarios non encore repris ici (RGPD,
avis, confirmation/replanification) restent couverts par des scripts HTTP
manuels, rejoués à chaque évolution du périmètre concerné.

**Suite unitaire complémentaire** (`backend/tests/`, mocks, aucune base
réelle) :

| Fichier | Scénarios couverts |
|---|---|
| `appointmentService.test.js` | Calcul des créneaux disponibles (découpage par durée, exclusion des créneaux pris et des autres jours de la semaine, date invalide/passée) ; règles d'annulation (rendez-vous introuvable, déjà clos, accès horizontal patient/médecin, annulation valide avec invalidation du cache) |
| `cacheService.test.js` | Mode dégradé sans connexion Redis (aucune fonction ne lève d'erreur) ; mise en cache puis expiration explicite d'une disponibilité ; mise en liste noire d'un token révoqué puis détection ; refus de mettre en liste noire un token déjà expiré |

**Suite frontend** (`frontend/src/`, Vitest + React Testing Library,
`npm test` côté frontend) :

| Fichier | Scénarios couverts |
|---|---|
| `pages/auth/Login.test.jsx` | Soumission avec identifiants invalides, affichage du message d'erreur renvoyé par l'API |
| `pages/patient/AppointmentBooking.test.jsx` | Bouton de confirmation désactivé tant qu'aucun créneau n'est sélectionné, activé une fois un créneau choisi |
| `components/ProtectedRoute.test.jsx` | Redirection vers `/connexion` d'un utilisateur non authentifié, accès autorisé pour un utilisateur authentifié, pas de redirection prématurée pendant la vérification de session |

## Environnement de test

### Base de données d'intégration : `mediconnect_test`

Les tests Supertest ne tournent **jamais** contre la base de
développement (`mediconnect`) : `backend/tests/integration/testDb.js`
charge exclusivement `backend/.env.test` et refuse de démarrer si
`DB_NAME` ne vaut pas exactement `mediconnect_test`. Cette séparation est
volontaire : un test d'intégration exécute de vraies requêtes SQL
(inscriptions, rendez-vous, suspension de compte...), et les lancer par
erreur sur la base de développement risquerait d'y mélanger des données
de test à de vraies données.

Procédure de création en local (MySQL déjà installé, schéma non chargé) :

```bash
# 1. Copier le fichier d'exemple puis l'adapter si besoin (mot de passe...)
cp backend/.env.test.example backend/.env.test

# 2. Créer la base à partir du schéma et du jeu d'essai. mediconnect.sql
#    crée en dur une base nommée "mediconnect" (DROP/CREATE/USE) : le sed
#    la renomme à la volée en mediconnect_test, sans toucher au fichier
#    utilisé tel quel par le déploiement (voir docs/DEPLOIEMENT.md).
sed 's/\bmediconnect\b/mediconnect_test/g' database/mediconnect.sql \
  | mysql -u root -p --default-character-set=utf8mb4
sed 's/\bmediconnect\b/mediconnect_test/g' database/seed.sql \
  | mysql -u root -p --default-character-set=utf8mb4

# 3. Lancer les tests
cd backend && npm test
```

`--default-character-set=utf8mb4` n'est pas cosmétique : sans lui, les
caractères accentués du jeu d'essai sont corrompus au chargement sur
certains environnements (constaté sous Windows en cours de rédaction).

Alternative sans MySQL local : `docker-compose.test.yml` démarre un
conteneur MySQL 8.4 dédié, isolé (port 3308, sans volume nommé donc sans
donnée persistante) — voir les commentaires en tête de ce fichier pour la
procédure complète.

En CI, le même principe s'applique avec un conteneur MySQL éphémère créé
pour la seule durée du job (voir `.github/workflows/ci.yml`) : aucune
donnée de développement n'existe dans cet environnement, la protection de
`testDb.js` y est redondante mais volontairement conservée, pour que le
même code de test se comporte à l'identique partout.

### Comptes du jeu d'essai (`database/seed.sql`)

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin.test@integration-test.local` | `AdminTest123!` |
| Patients (3) | `<prenom>.<nom>@integration-test.local` | `PatientTest123!` |
| Médecins (4, un par spécialité, validés) | `<prenom>.<nom>@integration-test.local` | `MedecinTest123!` |

Le domaine `integration-test.local` est distinct de `mediconnect.local`
(utilisé par les comptes réels et les comptes de vérification manuelle,
voir plus bas) pour ne jamais risquer de confusion entre jeu d'essai
automatisé et données de test manuelles.

### Tests fonctionnels manuels

- Base de données : instance MySQL de développement locale (même schéma
  que la production, `database/mediconnect.sql`), jamais la base de
  démonstration utilisée en soutenance.
- Comptes de test : convention `verif.<objet>.<horodatage>@mediconnect.local`,
  créés puis systématiquement supprimés après vérification par
  correspondance exacte d'e-mail (jamais de suppression par motif générique
  sur le domaine, qui risquerait d'atteindre de vrais comptes), jamais de
  données de test laissées en base.
- Tests unitaires : aucune dépendance à une base réelle (mocks explicites
  sur `logger`, `config/database` non importé par les modules testés).

## Critères d'entrée / de sortie

- **Entrée** : le code compile (`npm run build` frontend), le serveur
  démarre (`npm run dev` / `node server.js`), aucune régression connue
  sur l'authentification ou la réservation.
- **Sortie** : `npm test` (backend et frontend) au vert, `npm run lint`
  (backend et frontend) sans erreur, scénario de double réservation
  revérifié à chaque modification touchant les rendez-vous ou la base de
  données.

## Matrice de couverture fonctionnalité × test

| Fonctionnalité | Unitaire (Jest, mocks) | Intégration (Jest + Supertest) | Fonctionnel manuel (scripts HTTP) |
|---|---|---|---|
| Hachage / vérification de mot de passe | ✅ `hashPassword.test.js` | — | — |
| Génération / vérification de JWT | ✅ `generateToken.test.js` | ✅ (via connexion) | — |
| Middleware d'authentification (`protect`) | ✅ `authMiddleware.test.js` | ✅ (`/me` sans token) | ✅ (token invalide/révoqué) |
| Contrôle de rôle (`authorize`) | ✅ `roleMiddleware.test.js` | ✅ (`admin.test.js`, accès patient refusé) | — |
| Inscription (whitelist de rôle, consentement) | — | ✅ `auth.test.js` (rôle `admin` rejeté) | ✅ (inscription sans consentement rejetée) |
| Connexion / injection SQL / brute force | — | ✅ `auth.test.js` (identifiants invalides, injection SQL) | ✅ (compte suspendu, rate limiting) |
| Calcul des créneaux disponibles | ✅ `appointmentService.test.js` | — | ✅ |
| Réservation de rendez-vous | — | ✅ `appointments.test.js` | ✅ (voir `docs/JEU_ESSAI.md`) |
| **Double réservation (contrainte `UNIQUE`)** | — | ✅ `appointments.test.js` | ✅ — scénario détaillé dans `docs/JEU_ESSAI.md` |
| **Accès horizontal (RDV d'un autre patient)** | ✅ `appointmentService.test.js` | ✅ `appointments.test.js` | — |
| Règles d'annulation (statut, propriétaire) | ✅ `appointmentService.test.js` | ✅ `appointments.test.js` | ✅ |
| Confirmation / replanification / clôture | — | — | ✅ |
| Avis (création, note moyenne) | — | — | ✅ |
| Administration (validation médecin, suspension, journaux) | — | ✅ `admin.test.js` | ✅ (validation médecin) |
| Export / suppression RGPD | — | — | ✅ (export téléchargé, anonymisation vérifiée en base, token révoqué) |
| Cache Redis (mise en cache, expiration, liste noire, mode dégradé) | ✅ `cacheService.test.js` | — | ✅ (testé avec et sans Redis démarré) |
| Accès aux données (modèle) | ✅ `doctorModel.test.js` (intégration, jeu d'essai réel) | — | — |
| Composants frontend (Vitest + RTL) | ✅ `Login.test.jsx`, `AppointmentBooking.test.jsx`, `ProtectedRoute.test.jsx` | — | — |

## Résultats

- `npm test` (backend) : **49/49 tests passent** (11 suites : 6
  unitaires — dont `appointmentService` et `cacheService` — et 5
  d'intégration Supertest contre `mediconnect_test`), aucune régression
  connue.
- `npm test` (frontend, Vitest) : **5/5 tests passent** (3 fichiers :
  `Login`, `AppointmentBooking`, `ProtectedRoute`).
- `npm audit` (backend et frontend) : **0 vulnérabilité** au moment de la
  rédaction — deux vulnérabilités `high` ont été trouvées et corrigées en
  cours de session (voir `docs/VEILLE_SECURITE.md`).
- Scénario de double réservation : **systématiquement refusé (409)**,
  vérifié automatiquement à chaque exécution de `npm test`
  (`appointments.test.js`) depuis une vraie base MySQL, plus manuellement
  lors des évolutions du schéma.
