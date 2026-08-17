import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Médecin",
  admin: "Administrateur",
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function AdminDashboard() {
  const menu = [
    { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
    { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
    { label: "Médecins", path: "/admin/medecins", icon: "＋" },
    { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
    { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
    { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
  ];

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
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
        const [statsResponse, usersResponse, pendingResponse] =
          await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/users", { params: { limit: 5 } }),
            api.get("/admin/doctors/pending"),
          ]);

        setStats(statsResponse.data.stats);
        setUsers(usersResponse.data.users);
        setPendingDoctors(pendingResponse.data.doctors);
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

                <select defaultValue="six-months">
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

              <div className="activity-list">
                <div>
                  <span className="activity-icon">＋</span>
                  <p>
                    <strong>Nouveau médecin inscrit</strong>
                    <small>Dr Lucas Bernard · il y a 12 min</small>
                  </p>
                </div>

                <div>
                  <span className="activity-icon">□</span>
                  <p>
                    <strong>Nouveau rendez-vous</strong>
                    <small>Jean Dupont · il y a 28 min</small>
                  </p>
                </div>

                <div>
                  <span className="activity-icon">✓</span>
                  <p>
                    <strong>Compte médecin validé</strong>
                    <small>Dr Emma Robert · il y a 1 h</small>
                  </p>
                </div>

                <div>
                  <span className="activity-icon">○</span>
                  <p>
                    <strong>Nouvel utilisateur</strong>
                    <small>Sophie Leroy · il y a 2 h</small>
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <section className="dashboard-panel admin-users-panel">
            <div className="panel-heading">
              <div>
                <h2>Médecins en attente de validation</h2>
                <p>Ces comptes n’apparaissent pas encore publiquement.</p>
              </div>
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

              <button type="button" className="outline-button">
                Gérer les utilisateurs
              </button>
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
