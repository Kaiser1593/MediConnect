import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/doctor/dashboard", icon: "⌂" },
  { label: "Mon agenda", path: "/doctor/agenda", icon: "□" },
  { label: "Mes patients", path: "/doctor/patients", icon: "○" },
  { label: "Disponibilités", path: "/doctor/disponibilites", icon: "＋" },
  { label: "Mon profil", path: "/doctor/profil", icon: "⚙" },
];

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  phone: "",
  specialtyId: "",
  licenseNumber: "",
  biography: "",
  address: "",
  city: "",
  postalCode: "",
  consultationPrice: "",
  experienceYears: "",
};

function DoctorProfile() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        const [profileResponse, specialtiesResponse] = await Promise.all([
          api.get("/doctors/me"),
          api.get("/specialties"),
        ]);

        const profile = profileResponse.data.profile;

        setEmail(profile.email);
        setIsApproved(Boolean(profile.is_approved));
        setSpecialties(specialtiesResponse.data.specialties);
        setFormData({
          firstname: profile.firstname || "",
          lastname: profile.lastname || "",
          phone: profile.phone || "",
          specialtyId: profile.specialty_id || "",
          licenseNumber: profile.license_number || "",
          biography: profile.biography || "",
          address: profile.address || "",
          city: profile.city || "",
          postalCode: profile.postal_code || "",
          consultationPrice: profile.consultation_price || "",
          experienceYears: profile.experience_years || "",
        });
      } catch {
        setMessage({ type: "error", text: "Impossible de charger votre profil." });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
      await api.patch("/doctors/me", formData);
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
      role="Espace médecin"
      title="Mon profil"
      subtitle="Gérez vos informations professionnelles."
      menu={menu}
    >
      {!isApproved && !isLoading && (
        <div className="approval-banner">
          <span className="approval-banner-icon">!</span>
          <div>
            <strong>Compte en attente de validation</strong>
            <span>
              Un administrateur doit valider votre compte avant qu'il
              n'apparaisse dans les résultats de recherche des patients.
            </span>
          </div>
        </div>
      )}

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
                <label htmlFor="specialtyId">Spécialité</label>
                <select
                  id="specialtyId"
                  name="specialtyId"
                  value={formData.specialtyId}
                  onChange={handleChange}
                >
                  <option value="">Non renseignée</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="licenseNumber">Numéro RPPS</label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="biography">Biographie</label>
              <textarea
                id="biography"
                name="biography"
                rows="4"
                placeholder="Présentez votre parcours et votre pratique..."
                value={formData.biography}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Adresse du cabinet</label>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="consultationPrice">Tarif de consultation (€)</label>
                <input
                  id="consultationPrice"
                  name="consultationPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.consultationPrice}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experienceYears">Années d'expérience</label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
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

export default DoctorProfile;
