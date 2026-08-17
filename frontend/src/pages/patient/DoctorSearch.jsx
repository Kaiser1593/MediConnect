import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
  { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
  { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
  { label: "Mon profil", path: "/patient/profil", icon: "○" },
];

const getInitials = (firstname, lastname) =>
  `${firstname[0]}${lastname[0]}`.toUpperCase();

function DoctorSearch() {
  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({ search: "", specialty: "", city: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/specialties")
      .then((response) => setSpecialties(response.data.specialties))
      .catch(() => {
        // Un échec ici n'empêche pas la recherche : le filtre reste vide.
      });
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/doctors", {
          params: {
            search: appliedFilters.search || undefined,
            specialty: appliedFilters.specialty || undefined,
            city: appliedFilters.city || undefined,
          },
        });

        setDoctors(response.data.doctors);
        setTotal(response.data.pagination.total);
      } catch {
        setError("Impossible de charger la liste des médecins.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [appliedFilters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  return (
    <DashboardLayout
      role="Espace patient"
      title="Rechercher un médecin"
      subtitle="Trouvez rapidement un professionnel de santé."
      menu={menu}
    >
      <section className="search-panel">
        <form className="search-fields" onSubmit={handleSubmit}>
          <div>
            <label>Nom du médecin</label>
            <input
              name="search"
              placeholder="Dr Martin..."
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Spécialité</label>
            <select name="specialty" value={filters.specialty} onChange={handleChange}>
              <option value="">Toutes les spécialités</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.name}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Localisation</label>
            <input
              name="city"
              placeholder="Paris, Montreuil..."
              value={filters.city}
              onChange={handleChange}
            />
          </div>

          <button type="submit">Rechercher</button>
        </form>
      </section>

      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <div className="results-heading">
        <div>
          <h2>Professionnels disponibles</h2>
          <p>
            {isLoading
              ? "Recherche en cours..."
              : `${total} médecin${total > 1 ? "s" : ""} correspond${total > 1 ? "ent" : ""} à votre recherche.`}
          </p>
        </div>
      </div>

      {!isLoading && doctors.length === 0 && !error && (
        <p>Aucun médecin ne correspond à votre recherche.</p>
      )}

      <section className="doctor-results">
        {doctors.map((doctor) => (
          <article className="doctor-card" key={doctor.doctor_id}>
            <div className="doctor-card-profile">
              <div className="large-avatar">
                {getInitials(doctor.firstname, doctor.lastname)}
              </div>

              <div>
                <h3>{doctor.full_name}</h3>
                <p>{doctor.specialty || "Spécialité non renseignée"}</p>
                <span>
                  {doctor.average_rating
                    ? `★★★★★ ${doctor.average_rating} · ${doctor.review_count} avis`
                    : "Aucun avis pour le moment"}
                </span>
              </div>
            </div>

            <div className="doctor-card-information">
              <p>📍 {doctor.city || "Ville non renseignée"}</p>
              {doctor.experience_years && (
                <p>💼 {doctor.experience_years} ans d’expérience</p>
              )}
            </div>

            <div className="doctor-card-action">
              <span>Consultation</span>
              <strong>
                {doctor.consultation_price
                  ? `${Number(doctor.consultation_price)} €`
                  : "—"}
              </strong>

              <Link to={`/patient/reservation/${doctor.doctor_id}`}>
                Prendre rendez-vous
              </Link>
            </div>
          </article>
        ))}
      </section>
    </DashboardLayout>
  );
}

export default DoctorSearch;
