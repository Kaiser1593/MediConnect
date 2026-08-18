import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
  { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
  { label: "Médecins", path: "/admin/medecins", icon: "＋" },
  { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
  { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
  { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
];

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

function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/users", {
          params: { page: pagination.page, limit: 10 },
        });
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } catch {
        setError("Impossible de charger la liste des utilisateurs.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [pagination.page]);

  const handleToggleStatus = async (targetUser) => {
    setUpdatingId(targetUser.id);
    setError("");

    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        is_active: !targetUser.is_active,
      });

      setUsers((previous) =>
        previous.map((item) =>
          item.id === targetUser.id
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

  return (
    <DashboardLayout
      role="Administration"
      title="Utilisateurs"
      subtitle="Gérez les comptes inscrits sur MediConnect."
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
            <h2>Tous les utilisateurs</h2>
            <p>{pagination.total} compte(s) au total.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-header">
                <span>Utilisateur</span>
                <span>Adresse e-mail</span>
                <span>Rôle</span>
                <span>Inscription</span>
                <span>Statut</span>
              </div>

              {users.map((item) => (
                <div className="admin-table-row" key={item.id}>
                  <strong>
                    {item.firstname} {item.lastname}
                  </strong>
                  <span>{item.email}</span>
                  <span>{ROLE_LABELS[item.role] || item.role}</span>
                  <span>{formatDate(item.created_at)}</span>

                  {item.id === user.id ? (
                    <span
                      className={`status-badge ${item.is_active ? "confirmed" : "pending"}`}
                    >
                      {item.is_active ? "Actif" : "Inactif"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={
                        item.is_active ? "cancel-button" : "outline-button"
                      }
                      disabled={updatingId === item.id}
                      onClick={() => handleToggleStatus(item)}
                    >
                      {updatingId === item.id
                        ? "…"
                        : item.is_active
                          ? "Désactiver"
                          : "Activer"}
                    </button>
                  )}
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

export default AdminUsers;
