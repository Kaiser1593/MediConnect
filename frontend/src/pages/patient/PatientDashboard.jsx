import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";

const appointments = [
  {
    doctor: "Dr Sarah Martin",
    specialty: "Médecin généraliste",
    date: "12 août 2026",
    time: "14 h 30",
    status: "Confirmé",
  },
  {
    doctor: "Dr Lucas Bernard",
    specialty: "Dermatologue",
    date: "18 août 2026",
    time: "10 h 00",
    status: "En attente",
  },
  {
    doctor: "Dr Emma Robert",
    specialty: "Ophtalmologue",
    date: "25 août 2026",
    time: "16 h 15",
    status: "Confirmé",
  },
];

function PatientDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout
      title={`Bonjour ${user.firstname} 👋`}
      subtitle="Voici un aperçu de votre espace personnel."
    >
      <section className="dashboard-statistics">
        <article className="stat-card">
          <div className="stat-icon">□</div>
          <div>
            <span>Rendez-vous à venir</span>
            <strong>3</strong>
            <p>Deux confirmés</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">✓</div>
          <div>
            <span>Consultations terminées</span>
            <strong>8</strong>
            <p>Depuis janvier 2026</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">♡</div>
          <div>
            <span>Médecins favoris</span>
            <strong>4</strong>
            <p>Professionnels enregistrés</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">!</div>
          <div>
            <span>Documents disponibles</span>
            <strong>6</strong>
            <p>Ordonnances et comptes rendus</p>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel appointments-panel">
          <div className="panel-heading">
            <div>
              <h2>Prochains rendez-vous</h2>
              <p>Vos consultations médicales planifiées.</p>
            </div>

            <button type="button" className="outline-button">
              Voir tous
            </button>
          </div>

          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div
                className="appointment-row"
                key={`${appointment.doctor}-${appointment.date}`}
              >
                <div className="appointment-doctor">
                  <div className="small-avatar">
                    {appointment.doctor
                      .replace("Dr ", "")
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </div>

                  <div>
                    <strong>{appointment.doctor}</strong>
                    <span>{appointment.specialty}</span>
                  </div>
                </div>

                <div className="appointment-date">
                  <strong>{appointment.date}</strong>
                  <span>{appointment.time}</span>
                </div>

                <span
                  className={`status-badge ${
                    appointment.status === "Confirmé"
                      ? "confirmed"
                      : "pending"
                  }`}
                >
                  {appointment.status}
                </span>

                <button type="button" className="more-button">
                  •••
                </button>
              </div>
            ))}
          </div>
        </article>

        <aside className="dashboard-panel next-appointment">
          <div className="panel-heading">
            <div>
              <h2>Prochain rendez-vous</h2>
              <p>Dans 4 jours</p>
            </div>
          </div>

          <div className="next-doctor">
            <div className="large-avatar">SM</div>

            <div>
              <h3>Dr Sarah Martin</h3>
              <p>Médecin généraliste</p>
            </div>
          </div>

          <div className="next-details">
            <div>
              <span>Date</span>
              <strong>12 août 2026</strong>
            </div>

            <div>
              <span>Horaire</span>
              <strong>14 h 30</strong>
            </div>

            <div>
              <span>Adresse</span>
              <strong>Paris 11e</strong>
            </div>
          </div>

          <button type="button" className="primary-dashboard-button">
            Voir le rendez-vous
          </button>
        </aside>
      </section>

      <section className="dashboard-panel quick-actions-panel">
        <div className="panel-heading">
          <div>
            <h2>Actions rapides</h2>
            <p>Accédez rapidement aux principales fonctionnalités.</p>
          </div>
        </div>

        <div className="quick-actions">
          <button type="button">
            <span>＋</span>
            <strong>Prendre rendez-vous</strong>
            <small>Rechercher un professionnel</small>
          </button>

          <button type="button">
            <span>□</span>
            <strong>Mes rendez-vous</strong>
            <small>Consulter votre historique</small>
          </button>

          <button type="button">
            <span>○</span>
            <strong>Mettre à jour mon profil</strong>
            <small>Modifier vos informations</small>
          </button>

          <button type="button">
            <span>!</span>
            <strong>Mes documents</strong>
            <small>Voir vos documents médicaux</small>
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default PatientDashboard;