# Éco-conception

Absent du dossier initial (voir `database/CHANGELOG.md`), critère
explicite du référentiel. Chaque mesure ci-dessous est implémentée et
vérifiée dans le code, pas seulement listée comme bonne pratique
générique.

## Pagination des résultats de recherche

Toutes les listes potentiellement longues sont paginées côté serveur, pas
chargées intégralement puis découpées côté client :

- `GET /api/doctors` (recherche publique), `GET /api/admin/users`,
  `GET /api/admin/appointments`, `GET /api/admin/logs`,
  `GET /api/admin/doctors` : toutes acceptent `page`/`limit`, bornées
  côté serveur (`Math.min(limit, 100)` ou `50` selon la route), jamais de
  requête `SELECT *` sans `LIMIT`.

## Index SQL

Chaque colonne utilisée comme filtre ou jointure fréquente dans les
requêtes réelles du code est indexée (`database/mediconnect.sql`) :

| Table | Index | Requête qui en bénéficie |
|---|---|---|
| `utilisateurs` | `role` | Listes admin filtrées par rôle |
| `medecins` | `specialite_id`, `ville`, `est_valide` | Recherche publique de médecins |
| `disponibilites` | `(medecin_id, jour_semaine)` composite | Calcul des créneaux disponibles (`computeAvailableSlots`), appelé à chaque recherche/réservation |
| `rendez_vous` | `(patient_id, date_rdv)`, `(medecin_id, date_rdv)`, `statut` | Tableaux de bord, agenda médecin, filtre admin par statut |
| `avis` | `medecin_id` | Avis publics d'un médecin |
| `notifications` | `(utilisateur_id, lue)` | Liste des notifications non lues |
| `journaux_securite` | `(type_evenement, date_evenement)`, `utilisateur_id` | Page "Journaux" admin, filtre par type |

Plus une contrainte `UNIQUE` sur `rendez_vous (medecin_id, date_rdv,
heure_debut)`, qui sert doublement d'index et de garant d'intégrité
contre le double-booking (voir `docs/JEU_ESSAI.md`).

## Lazy loading des routes React

`frontend/src/App.jsx` : toutes les pages sauf l'accueil (`Home`, gardée
en chargement immédiat car c'est le point d'entrée le plus visité) sont
chargées à la demande via `React.lazy` + `Suspense`, plutôt que regroupées
dans un seul fichier JavaScript téléchargé dès la première visite.

**Mesuré, avant/après** (`npm run build`) :

| | Avant | Après |
|---|---|---|
| Bundle principal | 376,49 kB (108,39 kB gzip) | 290,28 kB (94,71 kB gzip) |
| Découpage | 1 seul fichier | ~24 chunks chargés à la demande |

Un visiteur qui ne consulte que la page d'accueil et le formulaire de
connexion ne télécharge plus le code des tableaux de bord administrateur,
de l'agenda médecin, etc.

## Compression gzip

`backend/app.js` : middleware `compression` (paquet npm `compression`)
activé sur toutes les réponses HTTP, avant le routage. Réduit la taille
des réponses JSON (listes de médecins, rendez-vous, journaux...)
transférées sur le réseau.

## Optimisation des images

Aucune image n'est actuellement servie dynamiquement par l'application :
pas d'upload d'avatar dans cette version (voir `database/CHANGELOG.md`,
section sur `uploadMiddleware.js`), pas d'image de contenu chargée depuis
le backend. Les seules images du projet sont les captures d'écran de
`docs/captures/`, hors périmètre applicatif. **Point d'extension** : si
l'upload d'avatar est implémenté, le pipeline attendu est un
redimensionnement/format moderne (WebP) à l'upload (`multer` +
`sharp`), pas un stockage de l'image brute envoyée par l'utilisateur.

## Cache Redis

`backend/services/cacheService.js` : les créneaux de disponibilité
affichés dans l'annuaire public (`GET /api/doctors/:id/availability`)
sont mis en cache 30 secondes, invalidés explicitement à chaque
réservation/annulation/replanification touchant ce médecin et cette
date — pas seulement laissés expirer. Évite de recalculer les mêmes
créneaux (jointure `disponibilites` + `rendez_vous`) à chaque
consultation de la fiche d'un médecin très demandé.

**Choix assumé** : la validation d'une réservation (le chemin qui doit
rester rigoureusement exact) ne passe jamais par ce cache — uniquement
l'affichage public en lecture seule. Voir `docs/PERIMETRE.md` et
`docs/JEU_ESSAI.md`.

L'application démarre et fonctionne sans Redis (mode dégradé, testé) :
le cache n'est qu'une optimisation, jamais une dépendance obligatoire.
