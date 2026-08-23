// backend/middleware/uploadMiddleware.js
// Réception des photos de profil (avatars) envoyées en multipart/form-data.
// Écrit directement sur le disque (backend/uploads/avatars/) : la base ne
// garde qu'un chemin (utilisateurs.avatar), jamais le fichier lui-même
// (voir database/CHANGELOG.md, section "Photo de profil").

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const AVATARS_DIR = path.join(__dirname, "..", "uploads", "avatars");

fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, AVATARS_DIR),
  // Nom aléatoire (pas l'identifiant utilisateur ni le nom d'origine du
  // fichier) : un chemin d'avatar ne doit pas permettre de deviner ou
  // d'énumérer les identifiants des comptes.
  filename: (req, file, callback) => {
    const extension = ALLOWED_MIME_TYPES[file.mimetype];
    callback(null, `${crypto.randomBytes(16).toString("hex")}${extension}`);
  },
});

// Rejette silencieusement (callback(null, false)) plutôt que de renvoyer
// une erreur au flux de parsing : multer continue de consommer le flux
// multipart jusqu'au bout, sans fichier. Faire l'inverse (callback(error))
// coupe la lecture du flux en plein milieu de l'upload — la requête reste
// alors bloquée en attente côté client, la réponse ne partant jamais
// (piège classique de multer, reproduit et vérifié manuellement pendant
// le développement de cette fonctionnalité). req.file reste alors
// simplement absent, déjà géré par authController.uploadMyAvatar (400
// "Aucune image valide...").
const fileFilter = (req, file, callback) => {
  callback(null, Boolean(ALLOWED_MIME_TYPES[file.mimetype]));
};

const singleAvatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
}).single("avatar");

// multer signale ses erreurs (type de fichier refusé, fichier trop
// volumineux...) via le callback de sa propre middleware, pas en
// levant une exception classique : sans cet adaptateur, errorMiddleware
// les traiterait comme des erreurs serveur inattendues (500) au lieu
// d'un 400 avec un message compréhensible par l'utilisateur.
const uploadAvatar = (req, res, next) => {
  singleAvatarUpload(req, res, (error) => {
    if (error) {
      error.statusCode = 400;

      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = "L'image dépasse la taille maximale autorisée (2 Mo).";
      }

      return next(error);
    }

    return next();
  });
};

module.exports = { uploadAvatar, AVATARS_DIR };
