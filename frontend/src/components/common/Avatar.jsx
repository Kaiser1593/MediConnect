// src/components/common/Avatar.jsx
// Affiche la photo de profil d'un utilisateur (patient, médecin) si elle
// existe, sinon ses initiales — jamais d'image cassée. Réutilise les
// classes .small-avatar/.large-avatar déjà utilisées partout dans
// l'application pour l'ancien rendu "initiales uniquement".

import { resolveUploadUrl } from "../../services/api";

function Avatar({ avatarUrl, firstname, lastname, size = "small", className }) {
  const resolvedClassName =
    className || (size === "large" ? "large-avatar" : "small-avatar");
  const initials = `${firstname?.[0] || ""}${lastname?.[0] || ""}`.toUpperCase();

  if (avatarUrl) {
    return (
      <img
        className={resolvedClassName}
        src={resolveUploadUrl(avatarUrl)}
        // Décorative : le nom complet est systématiquement affiché en
        // texte juste à côté de l'avatar dans tous les usages de ce
        // composant (répéter "Photo de X" ici serait redondant pour un
        // lecteur d'écran, voir docs/ACCESSIBILITE.md).
        alt=""
      />
    );
  }

  return <div className={resolvedClassName}>{initials}</div>;
}

export default Avatar;
