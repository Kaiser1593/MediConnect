import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
  { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
  { label: "Médecins", path: "/admin/medecins", icon: "＋" },
  { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
  { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
  { label: "Journaux", path: "/admin/journaux", icon: "≡" },
  { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
];

const EVENT_LABELS = {
  LOGIN_SUCCESS: "Connexion réussie",
  LOGIN_FAILED: "Connexion échouée",
  REGISTER: "Inscription",
  PASSWORD_CHANGED: "Mot de passe modifié",
  PASSWORD_RESET_REQUESTED: "Réinitialisation demandée",
  PASSWORD_RESET: "Mot de passe réinitialisé",
  ACCESS_DENIED: "Accès refusé",
  DOCTOR_APPROVED: "Médecin validé",
  USER_STATUS_CHANGED: "Statut modifié",
};

const EVENT_BADGE_CLASSES = {
  LOGIN_SUCCESS: "confirmed",
  LOGIN_FAILED: "cancelled",
  REGISTER: "confirmed",
  PASSWORD_CHANGED: "pending",
  PASSWORD_RESET_REQUESTED: "pending",
  PASSWORD_RESET: "pending",
  ACCESS_DENIED: "cancelled",
  DOCTOR_APPROVED: "confirmed",
  USER_STATUS_CHANGED: "pending",
};

const formatDateTime = (isoDate) =>
  new Date(isoDate).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [eventType, setEventType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/logs", {
          params: {
            page: pagination.page,
            limit: 20,
            event_type: eventType || undefined,
          },
        });
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } catch {
        setError("Impossible de charger les journaux de sécurité.");
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [pagination.page, eventType]);

  const handleFilterChange = (event) => {
    setEventType(event.target.value);
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  return (
    <DashboardLayout
      role="Administration"
      title="Journaux de sécurité"
      subtitle="Suivez les connexions, accès refusés et actions sensibles."
      menu={menu}
    >
      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-panel admin-users-panel">
        <div className="panel-heading">
          <div>
            <h2>Événements enregistrés</h2>
            <p>{pagination.total} événement(s) au total.</p>
          </div>

          <div className="form-group">
            <select value={eventType} onChange={handleFilterChange}>
              <option value="">Tous les types</option>
              {Object.entries(EVENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : logs.length === 0 ? (
          <p>Aucun événement enregistré.</p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-header">
                <span>Type</span>
                <span>Message</span>
                <span>Utilisateur</span>
                <span>Adresse IP</span>
                <span>Date</span>
              </div>

              {logs.map((log) => (
                <div className="admin-table-row" key={log.id}>
                  <span className={`status-badge ${EVENT_BADGE_CLASSES[log.event_type] || "pending"}`}>
                    {EVENT_LABELS[log.event_type] || log.event_type}
                  </span>
                  <span>{log.message}</span>
                  <span>
                    {log.user_id ? `${log.firstname} ${log.lastname}` : "—"}
                  </span>
                  <span>{log.ip_address || "—"}</span>
                  <span>{formatDateTime(log.created_at)}</span>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="outline-button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((previous) => ({ ...previous, page: previous.page - 1 }))
                  }
                >
                  Précédent
                </button>

                <span>
                  Page {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="outline-button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((previous) => ({ ...previous, page: previous.page + 1 }))
                  }
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
}

export default AdminLogs;
