# Journal des écarts entre l'Annexe B et le schéma réel

Ce document liste, table par table, les différences entre le schéma décrit
dans l'Annexe B du dossier de projet et le schéma effectivement implémenté
dans `database/mediconnect.sql`. Chaque écart est soit une **mise en
conformité** (le code a été aligné sur le dossier), soit une **évolution
technique assumée** (le code va plus loin que le dossier, pour une raison
défendable à l'oral).

## 1. Renommage complet en français

Le code utilisait initialement des noms de tables et de colonnes en
anglais (`users`, `doctors`, `appointments`...). Il a été entièrement
aligné sur l'Annexe B : `utilisateurs`, `medecins`, `rendez_vous`, etc.
Migration appliquée sans perte de données via
`database/migration_french_rename.sql` (sauvegarde complète prise avant
exécution).

**Choix technique assumé — frontière de traduction dans les modèles.**
Plutôt que de propager ce renommage à l'ensemble du code (contrôleurs,
services, composants React), la traduction est centralisée dans
`backend/models/*.js` et `backend/utils/enumMapping.js` : les requêtes SQL
parlent français, tout le reste de l'application continue de manipuler les
mêmes noms et valeurs qu'avant (`firstname`, `role: "patient"`,
`status: "confirmed"`...). C'est un jury qui inspecte la base de données
(structure, phpMyAdmin, requêtes SQL en direct) qui doit voir du français
conforme à l'Annexe B — ce que garantit ce choix — et non le nom d'une
variable JavaScript interne, invisible depuis la base. Cette frontière
réduit aussi considérablement le risque de régression sur une base de
code déjà fonctionnelle et testée.

## 2. Valeurs d'énumération traduites

Les `ENUM` suivent la même logique : stockage en français/majuscules en
base, traduction dans les modèles.

| Colonne | Valeurs en base | Valeurs manipulées par le code |
|---|---|---|
| `utilisateurs.role` | `PATIENT`, `MEDECIN`, `ADMIN` | `patient`, `doctor`, `admin` |
| `rendez_vous.statut` | `EN_ATTENTE`, `CONFIRME`, `ANNULE`, `TERMINE` | `pending`, `confirmed`, `cancelled`, `completed` |
| `patients.genre` | `FEMININ`, `MASCULIN`, `AUTRE` | `female`, `male`, `other` |
| `journaux_securite.type_evenement` | `CONNEXION_REUSSIE`, `ACCES_REFUSE`... | `LOGIN_SUCCESS`, `ACCESS_DENIED`... |

## 3. Améliorations conservées malgré la divergence avec l'Annexe B

- **`UNIQUE (medecin_id, date_rdv, heure_debut)` sur `rendez_vous`** — la
  prévention du double-booking est garantie par le SGBD, pas seulement
  par la logique applicative. Vérifié par un test de bout en bout : une
  seconde réservation sur un créneau déjà pris renvoie systématiquement
  une erreur 409, y compris en cas de requêtes concurrentes.
- **`medecins.est_valide`** — un médecin nouvellement inscrit n'apparaît
  pas dans les résultats de recherche publics tant qu'un administrateur
  ne l'a pas validé (voir `v_medecins_public`, filtrée sur cette colonne).
- **`utilisateurs.statut_compte`** (`ACTIF`/`SUSPENDU`) — remplace un
  simple booléen `is_active` par un ENUM explicite, nécessaire pour la
  fonctionnalité de suspension de compte par un administrateur.
- **Modèle de disponibilité récurrente (`disponibilites.jour_semaine`,
  1 à 7)** plutôt que des créneaux datés un par un avec un statut
  `DISPONIBLE`/`RESERVE`. Un médecin déclare un horaire hebdomadaire type
  une seule fois ; les créneaux réservables sont calculés à la volée en
  croisant cet horaire avec les rendez-vous déjà pris
  (`appointmentService.computeAvailableSlots`). Alternative plus simple à
  utiliser pour un médecin, et qui évite de devoir générer et maintenir
  des lignes de disponibilité pour chaque jour à l'infini.
- **Transaction sur la création de compte** (`userModel.createWithProfile`)
  — l'insertion dans `utilisateurs` et celle dans `patients`/`medecins` se
  font dans une seule transaction MySQL : en cas d'échec de la seconde,
  la première est annulée. Aucun compte orphelin possible.

## 4. Tables absentes de l'Annexe B, présentes dans le schéma réel

- **`avis`** — permet à un patient de laisser une note et un commentaire
  sur un rendez-vous terminé (une fois par rendez-vous). Fonctionnalité
  visible dans le diagramme de cas d'utilisation du dossier ("Laisser un
  avis sur un médecin") mais absente du schéma simplifié de l'Annexe B.
- **`reinitialisations_mot_de_passe`** — jetons de réinitialisation de mot
  de passe (générés aléatoirement, hachés en SHA-256 avant stockage, à
  usage unique, valables une heure). Implémente le cas d'utilisation
  "Réinitialiser mot de passe" du dossier, construit après la rédaction
  du dossier.
- **`journaux_securite`** — conforme au §3.5/§2.2/§2.5 du dossier, décrite
  en détail dans son propre point (Phase 3 initiale). Ajout, au passage
  de ce renommage, d'une colonne `user_agent` (capturée à chaque
  événement journalisé), qui manquait.
- **`notifications.rendez_vous_id`** — colonne nullable, absente
  jusqu'ici, ajoutée pour relier une notification à son rendez-vous
  d'origine (`ON DELETE SET NULL` : la suppression d'un rendez-vous ne
  supprime jamais l'historique de notifications).
- **`utilisateurs.consentement_rgpd_le`** — colonne nullable ajoutée en
  Phase 7, horodatage du consentement RGPD donné à l'inscription (case à
  cocher du formulaire, désormais réellement câblée et vérifiée côté
  serveur). Voir `docs/RGPD.md` pour l'implémentation complète (export des
  données, suppression avec anonymisation).

## 5. Fichier volontairement non recréé

`backend/middleware/uploadMiddleware.js` figure dans les captures
d'arborescence du dossier mais a été supprimé en amont de ce renommage
(aucun envoi de fichier n'était prévu à ce moment). Le dossier
`backend/uploads/avatars/` existe toujours sur le disque mais reste vide.
Choix assumé : un fichier vide ou un stub qui ne fait rien serait moins
défendable à l'oral que son absence pure et simple. Si une fonctionnalité
d'upload d'avatar est ajoutée plus tard, ce fichier sera recréé avec une
implémentation réelle (middleware `multer`, route, contrôleur, interface).

## 6. Journaux de sécurité (Phase 3)

La table `journaux_securite` existait déjà (issue d'un renommage antérieur
de `security_logs`) et respecte la structure exigée par le dossier :
`id`, `utilisateur_id`, `type_evenement`, `description`, `adresse_ip`,
`user_agent`, `date_evenement`, avec clé étrangère `ON DELETE SET NULL`.
Deux ajustements de conformité ont été faits lors de cette vérification :

- **Type de `date_evenement`** : c'était un `TIMESTAMP`, aligné en
  `DATETIME` pour correspondre exactement au script du dossier (schéma
  et base réelle).
- **Événement `MODIFICATION_ROLE`** : le dossier le liste parmi les
  événements minimums à journaliser, mais **aucune fonctionnalité ne
  permet à un administrateur de changer le rôle d'un utilisateur** dans
  cette version de l'application (le seul mécanisme d'administration des
  comptes est la suspension/réactivation, `SUSPENSION_COMPTE`). La
  constante `ROLE_CHANGED → MODIFICATION_ROLE` a été ajoutée dans
  `backend/utils/enumMapping.js`, prête à l'emploi, mais n'a aucun point
  d'appel : créer une fonctionnalité de changement de rôle uniquement
  pour remplir ce log serait une fonctionnalité fictive, non défendable
  à l'oral. Les cinq autres événements minimums (`CONNEXION_REUSSIE`,
  `CONNEXION_ECHOUEE`, `INSCRIPTION`, `ACCES_REFUSE`,
  `SUSPENSION_COMPTE`) sont bien journalisés, ainsi que des événements
  supplémentaires (`MOT_DE_PASSE_MODIFIE`, `REINITIALISATION_DEMANDEE`,
  `MOT_DE_PASSE_REINITIALISE`, `MEDECIN_VALIDE`).

**Bug corrigé au passage** : le filtre par type d'événement de
`GET /api/admin/logs?event_type=...` comparait directement la valeur
anglaise envoyée par `AdminLogs.jsx` (ex. `LOGIN_SUCCESS`) à la colonne
française `type_evenement` (qui contient `CONNEXION_REUSSIE`) — le
filtre ne retournait donc jamais aucun résultat depuis le renommage.
Corrigé dans `adminModel.getSecurityLogs` en traduisant `eventType` via
`EVENT_TYPE_TO_DB` avant la requête, comme c'était déjà fait pour le
filtre par statut de `getAllAppointments`.

## 7. Méthode de migration

`database/migration_french_rename.sql` transforme une base existante
(schéma anglais) en place, sans perte de données : pour chaque table, les
contraintes (clés étrangères, `CHECK`, index uniques) portant sur les
colonnes à renommer sont supprimées, les colonnes sont renommées/retypées,
puis les contraintes sont recréées à l'identique sous leur nouveau nom.
Les valeurs des `ENUM` déjà en base sont traduites via des `UPDATE ...
CASE` avant le changement de type final. `database/mediconnect.sql`
contient le schéma français final, pour une toute nouvelle installation.

Cette migration a été testée sur une copie de sauvegarde avant application
définitive, puis vérifiée par un parcours complet de bout en bout après
exécution (inscription, connexion, réservation, double réservation
refusée, confirmation, replanification, clôture, avis, actions
d'administration, journaux de sécurité, suspension de compte) — toutes les
données réelles existantes (comptes utilisateurs, rendez-vous) ont été
préservées.
