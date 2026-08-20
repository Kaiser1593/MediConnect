# MediConnect

Plateforme de prise de rendez-vous médicaux (React + Express + MySQL).

## Lancement avec Docker

Prérequis : Docker et Docker Compose.

1. Copier le fichier d'exemple et renseigner de vraies valeurs (secret JWT,
   mot de passe MySQL) :

   ```
   cp .env.example .env
   ```

2. Démarrer l'ensemble des services :

   ```
   docker compose up --build
   ```

   Au premier démarrage, MySQL charge automatiquement le schéma
   (`database/mediconnect.sql`), spécialités incluses.

3. Accéder à l'application :

   - Frontend : http://localhost:8080
   - API : http://localhost:5000/api
   - MySQL : localhost:3307 (le 3306 par défaut est volontairement évité :
     il entre en conflit avec une éventuelle instance MySQL locale)

4. Créer un compte administrateur (l'inscription publique ne le permet pas) :

   ```
   docker compose exec backend node scripts/createAdmin.js <email> <mot-de-passe>
   ```

### Arrêter / réinitialiser

- Arrêter les services (les données MySQL sont conservées) :

  ```
  docker compose down
  ```

- Réinitialiser complètement (supprime aussi le volume MySQL : au prochain
  `up`, la base est recréée intégralement depuis `database/mediconnect.sql`) :

  ```
  docker compose down -v
  docker compose up
  ```

- Redémarrer après une modification du code backend ou frontend (reconstruit
  les images) :

  ```
  docker compose up --build
  ```

## Lancement en développement (sans Docker)

```
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Le backend nécessite un fichier `backend/.env` (voir les variables
attendues dans `backend/config/database.js` et `backend/utils/generateToken.js`)
et une base MySQL locale chargée avec `database/mediconnect.sql`.

## Réinitialisation de mot de passe (envoi d'e-mail)

La fonctionnalité "Mot de passe oublié" envoie un vrai e-mail via SMTP.
Variables à renseigner dans `backend/.env` (voir `.env.example`) :

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton-adresse@gmail.com
SMTP_PASSWORD=mot-de-passe-d-application-16-caracteres
SMTP_FROM=ton-adresse@gmail.com
FRONTEND_URL=http://localhost:5173
```

`SMTP_PASSWORD` est un **mot de passe d'application** Gmail (généré sur
`myaccount.google.com/apppasswords`), jamais le mot de passe du compte
Google lui-même. Sans ces variables, la demande de réinitialisation
continue de fonctionner (même réponse, même comportement) mais l'e-mail
n'est pas réellement envoyé : l'échec est seulement tracé dans les logs
du serveur, jamais renvoyé au client.

## Tests

```
cd backend && npm test
```
## Lancement backend (node/express) (docker)

cd backend
npm run dev

docker compose up -d

## Arrêt backend docker

docker compose down