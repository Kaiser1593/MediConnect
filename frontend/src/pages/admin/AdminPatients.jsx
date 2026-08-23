import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
  { label: "Patients", path: "/admin/patients", icon: "○" },
  { label: "Médecins", path: "/admin/medecins", icon: "＋" },
  { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
  { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
  { label: "Journaux", path: "/admin/journaux", icon: "≡" },
  { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
];

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/users", {
          params: { page: pagination.page, limit: 10, role: "patient" },
        });
        setPatients(response.data.users);
        setPagination(response.data.pagination);
      } catch {
        setError("Impossible de charger la liste des patients.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, [pagination.page]);

  const handleToggleStatus = async (targetPatient) => {
    setUpdatingId(targetPatient.id);
    setError("");

    try {
      await api.patch(`/admin/users/${targetPatient.id}/status`, {
        is_active: !targetPatient.is_active,
      });

      setPatients((previous) =>
        previous.map((item) =>
          item.id === targetPatient.id
            ? { ...item, is_active: item.is_active ? 0 : 1 }
            : item,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "La mise à jour du statut a échoué.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (targetPatient) => {
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${targetPatient.firstname} ${targetPatient.lastname} ? Ses données personnelles seront anonymisées. Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setDeletingId(targetPatient.id);
    setError("");

    try {
      await api.delete(`/admin/users/${targetPatient.id}`);
      setPatients((previous) => previous.filter((item) => item.id !== targetPatient.id));
      setPagination((previous) => ({ ...previous, total: previous.total - 1 }));
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "La suppression a échoué.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout
      role="Administration"
      title="Patients"
      subtitle="Gérez les comptes patients inscrits sur MediConnect."
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
            <h2>Tous les patients</h2>
            <p>{pagination.total} patient(s) au total.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-header admin-table-header-patients">
                <span>Patient</span>
                <span>Adresse e-mail</span>
                <span>Inscription</span>
                <span>Statut</span>
              </div>

              {patients.map((item) => (
                <div className="admin-table-row admin-table-row-patients" key={item.id}>
                  <strong>
                    {item.firstname} {item.lastname}
                  </strong>
                  <span>{item.email}</span>
                  <span>{formatDate(item.created_at)}</span>

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className={
                        item.is_active ? "cancel-button" : "outline-button"
                      }
                      disabled={updatingId === item.id || deletingId === item.id}
                      onClick={() => handleToggleStatus(item)}
                    >
                      {updatingId === item.id
                        ? "…"
                        : item.is_active
                          ? "Désactiver"
                          : "Activer"}
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      disabled={updatingId === item.id || deletingId === item.id}
                      onClick={() => handleDelete(item)}
                    >
                      {deletingId === item.id ? "…" : "Supprimer"}
                    </button>
                  </div>
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

export default AdminPatients;
