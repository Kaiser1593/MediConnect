// src/components/common/AvatarUploader.jsx
// Widget d'envoi/suppression de la photo de profil, utilisé sur les pages
// "Mon profil" patient et médecin. Met à jour le contexte d'authentification
// dès la réponse de l'API : la sidebar (DashboardLayout) reflète le
// changement immédiatement, sans rechargement de page.

import { useState } from "react";

import Avatar from "./Avatar";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function AvatarUploader() {
  const { user, updateUser } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permet de resélectionner le même fichier ensuite
    if (!file) return;

    setError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await api.post("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateUser({ avatar_url: response.data.avatarUrl });
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message ||
          "L'envoi de la photo a échoué. Réessayez.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setError("");
    setIsUploading(true);

    try {
      await api.delete("/auth/me/avatar");
      updateUser({ avatar_url: null });
    } catch {
      setError("La suppression de la photo a échoué. Réessayez.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="avatar-uploader">
      <Avatar
        avatarUrl={user.avatar_url}
        firstname={user.firstname}
        lastname={user.lastname}
        size="large"
      />

      <div className="avatar-uploader-actions">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="visually-hidden"
          id="avatar-file-input"
        />

        <label htmlFor="avatar-file-input" className="outline-button">
          {isUploading ? "Envoi en cours…" : "Changer la photo"}
        </label>

        {user.avatar_url && (
          <button
            type="button"
            className="text-button"
            onClick={handleRemove}
            disabled={isUploading}
          >
            Supprimer la photo
          </button>
        )}
      </div>

      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default AvatarUploader;
