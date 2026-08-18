import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
  { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
  { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
  { label: "Mon profil", path: "/patient/profil", icon: "○" },
];

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  phone: "",
  birthDate: "",
  gender: "",
  address: "",
  city: "",
  postalCode: "",
};

function PatientProfile() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const response = await api.get("/patients/me");
        const profile = response.data.profile;

        setEmail(profile.email);
        setFormData({
          firstname: profile.firstname || "",
          lastname: profile.lastname || "",
          phone: profile.phone || "",
          birthDate: profile.birth_date ? profile.birth_date.slice(0, 10) : "",
          gender: profile.gender || "",
          address: profile.address || "",
          city: profile.city || "",
          postalCode: profile.postal_code || "",
        });
      } catch {
        setMessage({ type: "error", text: "Impossible de charger votre profil." });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSaving(true);

    try {
      await api.patch("/patients/me", formData);
      setMessage({ type: "success", text: "Votre profil a été mis à jour." });
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
      role="Espace patient"
      title="Mon profil"
      subtitle="Gérez vos informations personnelles."
      menu={menu}
    >
      {isLoading ? (
        <p className="route-loading">Chargement…</p>
      ) : (
        <section className="dashboard-panel">
          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse e-mail</label>
              <input value={email} disabled />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstname">Prénom</label>
                <input
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname">Nom</label>
                <input
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  id="phone"
                  name="phone"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthDate">Date de naissance</label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Genre</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Non renseigné</option>
                <option value="female">Femme</option>
                <option value="male">Homme</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">Ville</label>
                <input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">Code postal</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-dashboard-button"
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        </section>
      )}
    </DashboardLayout>
  );
}

export default PatientProfile;
