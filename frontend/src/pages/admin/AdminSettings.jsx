import { useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
  { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
  { label: "Médecins", path: "/admin/medecins", icon: "＋" },
  { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
  { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
  { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
];

const EMPTY_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function AdminSettings() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setIsSaving(true);

    try {
      await api.patch("/auth/password", formData);
      setMessage({ type: "success", text: "Votre mot de passe a été mis à jour." });
      setFormData(EMPTY_FORM);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "La mise à jour a échoué.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="Administration"
      title="Paramètres"
      subtitle="Gérez la sécurité de votre compte."
      menu={menu}
    >
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Changer mon mot de passe</h2>
            <p>Votre mot de passe actuel vous sera demandé.</p>
          </div>
        </div>

        {message.text && (
          <div className={`form-message ${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Mot de passe actuel</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="8 caractères minimum"
                value={formData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength="8"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength="8"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-dashboard-button"
            disabled={isSaving}
          >
            {isSaving ? "Enregistrement…" : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </section>
    </DashboardLayout>
  );
}

export default AdminSettings;
