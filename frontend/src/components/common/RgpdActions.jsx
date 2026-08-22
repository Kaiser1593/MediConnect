// src/components/common/RgpdActions.jsx
// Droits RGPD accessibles depuis n'importe quel profil (patient ou
// médecin) : export des données personnelles et suppression de compte.
// Partagé plutôt que dupliqué entre PatientProfile et DoctorProfile.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

function RgpdActions() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");
    setIsExporting(true);

    try {
      const response = await api.get("/auth/me/export");

      // Téléchargement déclenché côté navigateur : le fichier ne transite
      // jamais par un stockage intermédiaire, juste par la mémoire du
      // navigateur avant d'être proposé en enregistrement.
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mediconnect-donnees-personnelles.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Impossible d'exporter vos données pour le moment.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Supprimer définitivement votre compte ? Vos informations personnelles seront anonymisées et vous serez déconnecté. Cette action est irréversible.",
      )
    ) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await api.delete("/auth/me");
      logout();
      navigate("/", { replace: true });
    } catch {
      setError("Impossible de supprimer votre compte pour le moment.");
      setIsDeleting(false);
    }
  };

  return (
    <section className="dashboard-panel rgpd-panel">
      <h2>Confidentialité et données personnelles</h2>
      <p>
        Conformément au RGPD, vous pouvez récupérer une copie de vos données
        personnelles ou demander la suppression de votre compte à tout
        moment.
      </p>

      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <div className="rgpd-actions">
        <button
          type="button"
          className="secondary-dashboard-button"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "Export en cours…" : "Télécharger mes données"}
        </button>

        <button
          type="button"
          className="danger-dashboard-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Suppression en cours…" : "Supprimer mon compte"}
        </button>
      </div>
    </section>
  );
}

export default RgpdActions;
