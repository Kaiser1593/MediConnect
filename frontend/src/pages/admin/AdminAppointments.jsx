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

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

const STATUS_BADGE_CLASSES = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "confirmed",
  cancelled: "cancelled",
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatTime = (time) => time.slice(0, 5).replace(":", " h ");

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/appointments", {
          params: { page: pagination.page, limit: 10, status: status || undefined },
        });
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
      } catch {
        setError("Impossible de charger les rendez-vous.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [pagination.page, status]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  return (
    <DashboardLayout
      role="Administration"
      title="Rendez-vous"
      subtitle="Vue d'ensemble des rendez-vous de la plateforme."
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
            <h2>Tous les rendez-vous</h2>
            <p>{pagination.total} rendez-vous au total.</p>
          </div>

          <select value={status} onChange={handleStatusChange}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : appointments.length === 0 ? (
          <p>Aucun rendez-vous ne correspond à ce filtre.</p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-header">
                <span>Patient</span>
                <span>Médecin</span>
                <span>Date</span>
                <span>Horaire</span>
                <span>Statut</span>
              </div>

              {appointments.map((appointment) => (
                <div className="admin-table-row" key={appointment.id}>
                  <strong>
                    {appointment.patient_firstname} {appointment.patient_lastname}
                  </strong>
                  <span>
                    Dr {appointment.doctor_firstname} {appointment.doctor_lastname}
                  </span>
                  <span>{formatDate(appointment.scheduled_on)}</span>
                  <span>{formatTime(appointment.start_time)}</span>

                  <span
                    className={`status-badge ${STATUS_BADGE_CLASSES[appointment.status]}`}
                  >
                    {STATUS_LABELS[appointment.status]}
                  </span>
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

export default AdminAppointments;
