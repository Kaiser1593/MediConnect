import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
  { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
  { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
  { label: "Mon profil", path: "/patient/profil", icon: "○" },
];

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (time) => time.slice(0, 5).replace(":", " h ");

const daysUntil = (isoDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

function PatientDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
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
      } catch {
        setError("Impossible de charger vos rendez-vous.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const nextAppointment = appointments[0] || null;

  return (
    <DashboardLayout
      role="Espace patient"
      title={`Bonjour ${user.firstname} 👋`}
      subtitle="Voici un aperçu de votre espace personnel."
      menu={menu}
    >
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
                <span>Rendez-vous à venir</span>
                <strong>{stats.upcoming}</strong>
                <p>Sur {stats.total} au total</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">✓</div>
              <div>
                <span>Consultations terminées</span>
                <strong>{stats.completed}</strong>
                <p>Toutes périodes confondues</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">!</div>
              <div>
                <span>Rendez-vous annulés</span>
                <strong>{stats.cancelled}</strong>
                <p>Toutes périodes confondues</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">♡</div>
              <div>
                <span>Total des rendez-vous</span>
                <strong>{stats.total}</strong>
                <p>Depuis la création du compte</p>
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

                <Link to="/patient/rendez-vous" className="outline-button">
                  Voir tous
                </Link>
              </div>

              {appointments.length === 0 ? (
                <p>Aucun rendez-vous à venir pour le moment.</p>
              ) : (
                <div className="appointment-list">
                  {appointments.map((appointment) => (
                    <div className="appointment-row" key={appointment.id}>
                      <div className="appointment-doctor">
                        <div className="small-avatar">
                          {`${appointment.firstname[0]}${appointment.lastname[0]}`.toUpperCase()}
                        </div>

                        <div>
                          <strong>{appointment.doctor_name}</strong>
                          <span>{appointment.specialty || "Spécialité non renseignée"}</span>
                        </div>
                      </div>

                      <div className="appointment-date">
                        <strong>{formatDate(appointment.scheduled_on)}</strong>
                        <span>{formatTime(appointment.start_time)}</span>
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

            <aside className="dashboard-panel next-appointment">
              <div className="panel-heading">
                <div>
                  <h2>Prochain rendez-vous</h2>
                  <p>
                    {nextAppointment
                      ? daysUntil(nextAppointment.scheduled_on) === 0
                        ? "Aujourd’hui"
                        : `Dans ${daysUntil(nextAppointment.scheduled_on)} jour${
                            daysUntil(nextAppointment.scheduled_on) > 1 ? "s" : ""
                          }`
                      : "Aucun rendez-vous prévu"}
                  </p>
                </div>
              </div>

              {nextAppointment ? (
                <>
                  <div className="next-doctor">
                    <div className="large-avatar">
                      {`${nextAppointment.firstname[0]}${nextAppointment.lastname[0]}`.toUpperCase()}
                    </div>

                    <div>
                      <h3>{nextAppointment.doctor_name}</h3>
                      <p>{nextAppointment.specialty || "Spécialité non renseignée"}</p>
                    </div>
                  </div>

                  <div className="next-details">
                    <div>
                      <span>Date</span>
                      <strong>{formatDate(nextAppointment.scheduled_on)}</strong>
                    </div>

                    <div>
                      <span>Horaire</span>
                      <strong>{formatTime(nextAppointment.start_time)}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p>Prenez rendez-vous avec un professionnel de santé.</p>
              )}

              <Link to="/patient/medecins" className="primary-dashboard-button">
                Rechercher un médecin
              </Link>
            </aside>
          </section>
        </>
      )}

      <section className="dashboard-panel quick-actions-panel">
        <div className="panel-heading">
          <div>
            <h2>Actions rapides</h2>
            <p>Accédez rapidement aux principales fonctionnalités.</p>
          </div>
        </div>

        <div className="quick-actions">
          <Link to="/patient/medecins">
            <span>＋</span>
            <strong>Prendre rendez-vous</strong>
            <small>Rechercher un professionnel</small>
          </Link>

          <Link to="/patient/rendez-vous">
            <span>□</span>
            <strong>Mes rendez-vous</strong>
            <small>Consulter votre historique</small>
          </Link>

          <Link to="/patient/profil">
            <span>○</span>
            <strong>Mettre à jour mon profil</strong>
            <small>Modifier vos informations</small>
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default PatientDashboard;
