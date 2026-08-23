import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Médecin",
  admin: "Administrateur",
};

const ACTIVITY_ICONS = {
  LOGIN_SUCCESS: "○",
  LOGIN_FAILED: "!",
  REGISTER: "＋",
  PASSWORD_CHANGED: "⚙",
  PASSWORD_RESET_REQUESTED: "⚙",
  PASSWORD_RESET: "⚙",
  ACCESS_DENIED: "!",
  DOCTOR_APPROVED: "✓",
  USER_STATUS_CHANGED: "○",
};

const ACTIVITY_TITLES = {
  LOGIN_SUCCESS: "Connexion",
  LOGIN_FAILED: "Connexion échouée",
  REGISTER: "Nouvel utilisateur",
  PASSWORD_CHANGED: "Mot de passe modifié",
  PASSWORD_RESET_REQUESTED: "Réinitialisation demandée",
  PASSWORD_RESET: "Mot de passe réinitialisé",
  ACCESS_DENIED: "Accès refusé",
  DOCTOR_APPROVED: "Médecin validé",
  USER_STATUS_CHANGED: "Statut modifié",
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// Reprend les vrais événements de security_logs plutôt que des exemples
// écrits en dur : les horodatages y sont réels, donc affichés en relatif.
const formatRelativeTime = (isoDate) => {
  const diffMinutes = Math.max(
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60000),
    0,
  );

  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  return `il y a ${Math.round(diffHours / 24)} j`;
};

function AdminDashboard() {
  const menu = [
    { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
    { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
    { label: "Médecins", path: "/admin/medecins", icon: "＋" },
    { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
    { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
    { label: "Journaux", path: "/admin/journaux", icon: "≡" },
    { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
  ];

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  // reloadIndex change relance l'effet : c'est ainsi que handleApprove
  // déclenche un nouveau chargement après avoir validé un médecin.
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [statsResponse, usersResponse, pendingResponse, logsResponse] =
          await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/users", { params: { limit: 5 } }),
            api.get("/admin/doctors/pending"),
            api.get("/admin/logs", { params: { limit: 4 } }),
          ]);

        setStats(statsResponse.data.stats);
        setUsers(usersResponse.data.users);
        setPendingDoctors(pendingResponse.data.doctors);
        setRecentLogs(logsResponse.data.logs);
      } catch {
        setError("Impossible de charger les données du tableau de bord.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [reloadIndex]);

  const handleApprove = async (doctorId) => {
    try {
      setApprovingId(doctorId);
      await api.patch(`/admin/doctors/${doctorId}/approve`);
      setReloadIndex((previous) => previous + 1);
    } catch {
      setError("La validation du médecin a échoué. Réessayez.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <DashboardLayout
      role="Administration"
      title="Tableau de bord administrateur"
      subtitle="Supervisez l’activité globale de MediConnect."
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
              <div className="stat-icon">○</div>
              <div>
                <span>Utilisateurs inscrits</span>
                <strong>{stats.totalUsers}</strong>
                <p>Tous rôles confondus</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">＋</div>
              <div>
                <span>Médecins validés</span>
                <strong>{stats.approvedDoctors}</strong>
                <p>{stats.pendingDoctors} validation(s) en attente</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">□</div>
              <div>
                <span>Rendez-vous planifiés</span>
                <strong>{stats.totalAppointments}</strong>
                <p>Toutes périodes confondues</p>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">!</div>
              <div>
                <span>Médecins en attente</span>
                <strong>{stats.pendingDoctors}</strong>
                <p>À valider</p>
              </div>
            </article>
          </section>

          <section className="admin-overview">
            <article className="dashboard-panel admin-chart">
              <div className="panel-heading">
                <div>
                  <h2>Évolution des inscriptions</h2>
                  <p>Nombre de nouveaux utilisateurs sur six mois.</p>
                </div>

                <select
                  defaultValue="six-months"
                  aria-label="Période affichée"
                >
                  <option value="six-months">6 derniers mois</option>
                </select>
              </div>

              <div className="fake-chart">
                <div style={{ height: "38%" }}>
                  <span>Mars</span>
                </div>
                <div style={{ height: "52%" }}>
                  <span>Avril</span>
                </div>
                <div style={{ height: "47%" }}>
                  <span>Mai</span>
                </div>
                <div style={{ height: "68%" }}>
                  <span>Juin</span>
                </div>
                <div style={{ height: "82%" }}>
                  <span>Juillet</span>
                </div>
                <div style={{ height: "100%" }}>
                  <span>Août</span>
                </div>
              </div>
            </article>

            <aside className="dashboard-panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Activité récente</h2>
                  <p>Dernières actions sur la plateforme.</p>
                </div>
              </div>

              {recentLogs.length === 0 ? (
                <p>Aucune activité récente.</p>
              ) : (
                <div className="activity-list">
                  {recentLogs.map((log) => (
                    <div key={log.id}>
                      <span className="activity-icon">
                        {ACTIVITY_ICONS[log.event_type] || "○"}
                      </span>
                      <p>
                        <strong>{ACTIVITY_TITLES[log.event_type] || log.event_type}</strong>
                        <small>
                          {log.firstname ? `${log.firstname} ${log.lastname} · ` : ""}
                          {formatRelativeTime(log.created_at)}
                        </small>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </section>

          <section className="dashboard-panel admin-users-panel">
            <div className="panel-heading">
              <div>
                <h2>Médecins en attente de validation</h2>
                <p>Ces comptes n’apparaissent pas encore publiquement.</p>
              </div>

              <Link to="/admin/medecins" className="outline-button">
                Voir tous les médecins
              </Link>
            </div>

            {pendingDoctors.length === 0 ? (
              <p>Aucun médecin en attente de validation.</p>
            ) : (
              <div className="admin-table">
                <div className="admin-table-header">
                  <span>Médecin</span>
                  <span>Adresse e-mail</span>
                  <span>Ville</span>
                  <span>Inscription</span>
                  <span>Action</span>
                </div>

                {pendingDoctors.map((doctor) => (
                  <div className="admin-table-row" key={doctor.id}>
                    <strong>
                      Dr {doctor.firstname} {doctor.lastname}
                    </strong>
                    <span>{doctor.email}</span>
                    <span>{doctor.city || "—"}</span>
                    <span>{formatDate(doctor.created_at)}</span>

                    <button
                      type="button"
                      className="outline-button"
                      disabled={approvingId === doctor.id}
                      onClick={() => handleApprove(doctor.id)}
                    >
                      {approvingId === doctor.id ? "Validation…" : "Valider"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel admin-users-panel">
            <div className="panel-heading">
              <div>
                <h2>Derniers utilisateurs inscrits</h2>
                <p>Comptes récemment créés sur MediConnect.</p>
              </div>

              <Link to="/admin/utilisateurs" className="outline-button">
                Gérer les utilisateurs
              </Link>
            </div>

            <div className="admin-table">
              <div className="admin-table-header">
                <span>Utilisateur</span>
                <span>Adresse e-mail</span>
                <span>Rôle</span>
                <span>Inscription</span>
                <span>Statut</span>
              </div>

              {users.map((user) => (
                <div className="admin-table-row" key={user.id}>
                  <strong>
                    {user.firstname} {user.lastname}
                  </strong>
                  <span>{user.email}</span>
                  <span>{ROLE_LABELS[user.role] || user.role}</span>
                  <span>{formatDate(user.created_at)}</span>

                  <span
                    className={`status-badge ${
                      user.is_active ? "confirmed" : "pending"
                    }`}
                  >
                    {user.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
