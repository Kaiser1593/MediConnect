import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";

const appointments = [
  {
    patient: "Jean Dupont",
    reason: "Consultation générale",
    time: "09 h 00",
    status: "Confirmé",
  },
  {
    patient: "Sophie Leroy",
    reason: "Consultation de suivi",
    time: "10 h 30",
    status: "Confirmé",
  },
  {
    patient: "Thomas Bernard",
    reason: "Certificat médical",
    time: "14 h 00",
    status: "En attente",
  },
  {
    patient: "Nina Robert",
    reason: "Douleur persistante",
    time: "16 h 15",
    status: "Confirmé",
  },
];

function DoctorDashboard() {
  const { user } = useAuth();

  const menu = [
    { label: "Tableau de bord", path: "/doctor/dashboard", icon: "⌂" },
    { label: "Mon agenda", path: "/doctor/agenda", icon: "□" },
    { label: "Mes patients", path: "/doctor/patients", icon: "○" },
    { label: "Disponibilités", path: "/doctor/disponibilites", icon: "＋" },
    { label: "Mon profil", path: "/doctor/profil", icon: "⚙" },
  ];

  return (
    <DashboardLayout
      role="Espace médecin"
      title="Tableau de bord médecin"
      subtitle="Gérez votre activité et vos rendez-vous."
      menu={menu}
    >
      {!user.is_approved && (
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

      <section className="dashboard-statistics">
        <article className="stat-card">
          <div className="stat-icon">□</div>
          <div>
            <span>Rendez-vous aujourd’hui</span>
            <strong>8</strong>
            <p>Prochain à 09 h 00</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">○</div>
          <div>
            <span>Patients suivis</span>
            <strong>126</strong>
            <p>12 nouveaux ce mois-ci</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">✓</div>
          <div>
            <span>Consultations terminées</span>
            <strong>42</strong>
            <p>Ce mois-ci</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">!</div>
          <div>
            <span>Demandes en attente</span>
            <strong>5</strong>
            <p>À traiter aujourd’hui</p>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel appointments-panel">
          <div className="panel-heading">
            <div>
              <h2>Rendez-vous du jour</h2>
              <p>Mercredi 12 août 2026</p>
            </div>

            <button type="button" className="outline-button">
              Voir l’agenda
            </button>
          </div>

          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div
                className="doctor-appointment-row"
                key={appointment.patient}
              >
                <div className="appointment-time-block">
                  <strong>{appointment.time}</strong>
                  <span>30 min</span>
                </div>

                <div className="appointment-doctor">
                  <div className="small-avatar">
                    {appointment.patient
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </div>

                  <div>
                    <strong>{appointment.patient}</strong>
                    <span>{appointment.reason}</span>
                  </div>
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

                <button type="button" className="outline-button">
                  Consulter
                </button>
              </div>
            ))}
          </div>
        </article>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Disponibilités</h2>
              <p>Cette semaine</p>
            </div>
          </div>

          <div className="availability-list">
            <div>
              <span>Lundi</span>
              <strong>09 h 00 – 18 h 00</strong>
            </div>

            <div>
              <span>Mardi</span>
              <strong>09 h 00 – 17 h 00</strong>
            </div>

            <div>
              <span>Mercredi</span>
              <strong>09 h 00 – 18 h 00</strong>
            </div>

            <div>
              <span>Jeudi</span>
              <strong>Indisponible</strong>
            </div>

            <div>
              <span>Vendredi</span>
              <strong>10 h 00 – 16 h 00</strong>
            </div>
          </div>

          <button type="button" className="primary-dashboard-button">
            Modifier mes disponibilités
          </button>
        </aside>
      </section>
    </DashboardLayout>
  );
}

export default DoctorDashboard;