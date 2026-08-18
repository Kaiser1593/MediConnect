import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/doctor/dashboard", icon: "⌂" },
  { label: "Mon agenda", path: "/doctor/agenda", icon: "□" },
  { label: "Mes patients", path: "/doctor/patients", icon: "○" },
  { label: "Disponibilités", path: "/doctor/disponibilites", icon: "＋" },
  { label: "Mon profil", path: "/doctor/profil", icon: "⚙" },
];

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

// weekday : 1 = lundi ... 7 = dimanche, comme en base.
const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const formatTime = (time) => time.slice(0, 5).replace(":", " h ");

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function DoctorDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/appointments/me");
        setStats(response.data.stats);
        setAppointments(response.data.appointments);
        setAvailabilities(response.data.availabilities);
      } catch {
        setError("Impossible de charger votre tableau de bord.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const todayLabel = capitalize(
    new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );

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

      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="route-loading">Chargement…</p>
      ) : (
        <>
          <section className="dashboard-statistics">
            <article className="stat-card">
              <div className="stat-icon">□</div>
              <div>
                <span>Rendez-vous aujourd’hui</span>
                <strong>{stats.today}</strong>
                <p>
                  {appointments.length > 0
                    ? `Prochain à ${formatTime(appointments[0].start_time)}`
                    : "Aucun pour l’instant"}
                </p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">○</div>
              <div>
                <span>Patients suivis</span>
                <strong>{stats.totalPatients}</strong>
                <p>Patients distincts reçus</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">✓</div>
              <div>
                <span>Consultations terminées</span>
                <strong>{stats.completedThisMonth}</strong>
                <p>Ce mois-ci</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">!</div>
              <div>
                <span>Demandes en attente</span>
                <strong>{stats.pending}</strong>
                <p>À confirmer</p>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel appointments-panel">
              <div className="panel-heading">
                <div>
                  <h2>Rendez-vous du jour</h2>
                  <p>{todayLabel}</p>
                </div>

                <Link to="/doctor/agenda" className="outline-button">
                  Voir l’agenda
                </Link>
              </div>

              {appointments.length === 0 ? (
                <p>Aucun rendez-vous prévu aujourd’hui.</p>
              ) : (
                <div className="appointment-list">
                  {appointments.map((appointment) => (
                    <div className="doctor-appointment-row" key={appointment.id}>
                      <div className="appointment-time-block">
                        <strong>{formatTime(appointment.start_time)}</strong>
                      </div>

                      <div className="appointment-doctor">
                        <div className="small-avatar">
                          {`${appointment.firstname[0]}${appointment.lastname[0]}`.toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {appointment.firstname} {appointment.lastname}
                          </strong>
                          <span>{appointment.reason || "Motif non précisé"}</span>
                        </div>
                      </div>

                      <span
                        className={`status-badge ${
                          appointment.status === "confirmed" ? "confirmed" : "pending"
                        }`}
                      >
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <aside className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Disponibilités</h2>
                  <p>Horaires récurrents</p>
                </div>
              </div>

              <div className="availability-list">
                {WEEKDAY_LABELS.map((label, index) => {
                  const dayAvailabilities = availabilities.filter(
                    (availability) => availability.weekday === index + 1,
                  );

                  return (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>
                        {dayAvailabilities.length === 0
                          ? "Indisponible"
                          : dayAvailabilities
                              .map(
                                (availability) =>
                                  `${formatTime(availability.start_time)} – ${formatTime(availability.end_time)}`,
                              )
                              .join(" / ")}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <Link to="/doctor/disponibilites" className="primary-dashboard-button">
                Modifier mes disponibilités
              </Link>
            </aside>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default DoctorDashboard;
