import { Link } from "react-router-dom";
import DemoLayout from "../../components/layout/DemoLayout";

const doctors = [
  {
    initials: "SM",
    name: "Dr Sarah Martin",
    specialty: "Médecin généraliste",
    location: "Paris 11e",
    experience: "12 ans d’expérience",
    availability: "Disponible aujourd’hui",
    price: "30 €",
  },
  {
    initials: "LB",
    name: "Dr Lucas Bernard",
    specialty: "Dermatologue",
    location: "Paris 12e",
    experience: "9 ans d’expérience",
    availability: "Disponible demain",
    price: "50 €",
  },
  {
    initials: "ER",
    name: "Dr Emma Robert",
    specialty: "Ophtalmologue",
    location: "Paris 19e",
    experience: "15 ans d’expérience",
    availability: "Disponible le 14 août",
    price: "45 €",
  },
  {
    initials: "ND",
    name: "Dr Nicolas Dubois",
    specialty: "Cardiologue",
    location: "Montreuil",
    experience: "18 ans d’expérience",
    availability: "Disponible le 16 août",
    price: "60 €",
  },
];

function DoctorSearch() {
  const menu = [
    { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
    { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
    { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
    { label: "Mon profil", path: "/patient/profil", icon: "○" },
  ];

  return (
    <DemoLayout
      role="Espace patient"
      title="Rechercher un médecin"
      subtitle="Trouvez rapidement un professionnel de santé."
      menu={menu}
    >
      <section className="search-panel">
        <div className="search-fields">
          <div>
            <label>Spécialité ou médecin</label>
            <input placeholder="Médecin généraliste, dermatologue..." />
          </div>

          <div>
            <label>Localisation</label>
            <input placeholder="Paris, Montreuil..." />
          </div>

          <div>
            <label>Date</label>
            <input type="date" />
          </div>

          <button type="button">Rechercher</button>
        </div>
      </section>

      <div className="results-heading">
        <div>
          <h2>Professionnels disponibles</h2>
          <p>24 médecins correspondent à votre recherche.</p>
        </div>

        <select defaultValue="availability">
          <option value="availability">Disponibilité</option>
          <option value="price">Prix croissant</option>
          <option value="experience">Expérience</option>
        </select>
      </div>

      <section className="doctor-results">
        {doctors.map((doctor) => (
          <article className="doctor-card" key={doctor.name}>
            <div className="doctor-card-profile">
              <div className="large-avatar">{doctor.initials}</div>

              <div>
                <h3>{doctor.name}</h3>
                <p>{doctor.specialty}</p>
                <span>★★★★★ 4,9 · 126 avis</span>
              </div>
            </div>

            <div className="doctor-card-information">
              <p>📍 {doctor.location}</p>
              <p>💼 {doctor.experience}</p>
              <p className="availability-text">● {doctor.availability}</p>
            </div>

            <div className="doctor-card-action">
              <span>Consultation</span>
              <strong>{doctor.price}</strong>

              <Link to="/patient/reservation">
                Prendre rendez-vous
              </Link>
            </div>
          </article>
        ))}
      </section>
    </DemoLayout>
  );
}

export default DoctorSearch;