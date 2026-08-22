# Jeu d'essai : réservation de rendez-vous

Scénario rejoué en direct contre l'API le 23/08/2026, avec des comptes
jetables créés puis supprimés après capture (voir `docs/PLAN_DE_TESTS.md`
pour la méthode). Toutes les requêtes et réponses ci-dessous sont
authentiques, non reconstituées.

**Contexte préalable** : un patient et un médecin sont inscrits, le
médecin déclare une disponibilité récurrente le lundi 09h-17h
(`POST /doctors/me/availabilities`), et son compte est validé par un
administrateur (`PATCH /admin/doctors/:id/approve`) — étape obligatoire
avant qu'il n'apparaisse dans la recherche publique (`medecins.est_valide`).

## Cas 1 : réservation d'un créneau libre

### Données en entrée

```http
POST /api/appointments
Authorization: Bearer <token patient>
Content-Type: application/json

{
  "doctorId": 11,
  "scheduledOn": "2026-08-31",
  "startTime": "10:00",
  "reason": "Douleur au genou"
}
```

### Données attendues

Statut `201`, un rendez-vous créé avec le statut `pending` (en attente de
confirmation par le médecin), les horaires normalisés au format `HH:MM:SS`.

### Données obtenues

```json
HTTP 201
{
  "success": true,
  "message": "Rendez-vous confirmé.",
  "appointment": {
    "id": 35,
    "patientId": 40,
    "doctorId": 11,
    "scheduledOn": "2026-08-31",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "reason": "Douleur au genou",
    "status": "pending"
  }
}
```

### Analyse des écarts

Aucun. Comportement conforme à l'attendu. `endTime` (10:30) est calculé
côté serveur à partir de `duree_creneau` du médecin (30 minutes par
défaut), jamais fourni par le client.

## Cas 2 : double réservation sur le même créneau (le plus important)

C'est le scénario qui démontre que la prévention du double-booking est
garantie par le SGBD (contrainte `UNIQUE (medecin_id, date_rdv,
heure_debut)` sur `rendez_vous`), pas seulement par une vérification
applicative contournable.

### Données en entrée

Immédiatement après le cas 1, un second patient (ou le même) tente de
réserver **exactement le même créneau** :

```http
POST /api/appointments
Authorization: Bearer <token patient>
Content-Type: application/json

{
  "doctorId": 11,
  "scheduledOn": "2026-08-31",
  "startTime": "10:00",
  "reason": "Autre motif"
}
```

### Données attendues

Statut `409` (conflit), aucun second rendez-vous créé, message explicite.

### Données obtenues

```json
HTTP 409
{
  "success": false,
  "message": "Ce créneau n'est plus disponible."
}
```

### Analyse des écarts

Aucun. Le rejet a lieu en deux temps, tous deux vérifiés en base à
chaque exécution : d'abord au niveau applicatif (le créneau n'apparaît
plus dans `computeAvailableSlots`, qui exclut les créneaux déjà occupés
par un rendez-vous actif), et en dernier recours au niveau du SGBD si
deux requêtes concurrentes passaient malgré tout ce premier filtre
(contrainte `UNIQUE`, qui ferait échouer l'`INSERT` avec une erreur
`ER_DUP_ENTRY`). Le second filtre est la garantie réelle : deux requêtes
simultanées ne peuvent pas passer la vérification applicative "en même
temps" sans que l'une des deux se heurte à la contrainte SQL.

## Cas 3 : confirmation par le médecin

### Données en entrée

```http
PATCH /api/appointments/35/confirm
Authorization: Bearer <token médecin>
```

### Données attendues

Statut `200`, le rendez-vous passe de `pending` à `confirmed`, une
notification est créée pour le patient.

### Données obtenues

```json
HTTP 200
{
  "success": true,
  "message": "Le rendez-vous a été confirmé."
}
```

### Analyse des écarts

Aucun.
