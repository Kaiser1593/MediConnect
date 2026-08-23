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

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/doctors", {
          params: { page: pagination.page, limit: 10 },
        });
        setDoctors(response.data.doctors);
        setPagination(response.data.pagination);
      } catch {
        setError("Impossible de charger la liste des médecins.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [pagination.page]);

  const handleApprove = async (doctorId) => {
    setApprovingId(doctorId);
    setError("");

    try {
      await api.patch(`/admin/doctors/${doctorId}/approve`);
      setDoctors((previous) =>
        previous.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, is_approved: 1 } : doctor,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "La validation a échoué.",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (doctorId) => {
    if (
      !window.confirm(
        "Révoquer la validation de ce médecin ? Il disparaîtra immédiatement des résultats de recherche des patients.",
      )
    ) {
      return;
    }

    setRejectingId(doctorId);
    setError("");

    try {
      await api.patch(`/admin/doctors/${doctorId}/reject`);
      setDoctors((previous) =>
        previous.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, is_approved: 0 } : doctor,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "La révocation a échoué.",
      );
    } finally {
      setRejectingId(null);
    }
  };

  const handleDelete = async (doctor) => {
    if (
      !window.confirm(
        `Supprimer définitivement le compte du Dr ${doctor.firstname} ${doctor.lastname} ? Ses données personnelles seront anonymisées et il disparaîtra de la recherche. Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setDeletingId(doctor.id);
    setError("");

    try {
      await api.delete(`/admin/users/${doctor.user_id}`);
      setDoctors((previous) => previous.filter((item) => item.id !== doctor.id));
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
      title="Médecins"
      subtitle="Consultez et validez les comptes médecins."
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
            <h2>Tous les médecins</h2>
            <p>{pagination.total} médecin(s) au total.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-header">
                <span>Médecin</span>
                <span>Adresse e-mail</span>
                <span>Spécialité</span>
                <span>Ville</span>
                <span>Statut</span>
              </div>

              {doctors.map((doctor) => (
                <div className="admin-table-row" key={doctor.id}>
                  <strong>
                    Dr {doctor.firstname} {doctor.lastname}
                  </strong>
                  <span>{doctor.email}</span>
                  <span>{doctor.specialty || "—"}</span>
                  <span>{doctor.city || "—"}</span>

                  <div className="admin-row-actions">
                    {doctor.is_approved ? (
                      <button
                        type="button"
                        className="cancel-button"
                        disabled={rejectingId === doctor.id || deletingId === doctor.id}
                        onClick={() => handleReject(doctor.id)}
                      >
                        {rejectingId === doctor.id ? "Révocation…" : "Révoquer"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="outline-button"
                        disabled={approvingId === doctor.id || deletingId === doctor.id}
                        onClick={() => handleApprove(doctor.id)}
                      >
                        {approvingId === doctor.id ? "Validation…" : "Valider"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="cancel-button"
                      disabled={approvingId === doctor.id || rejectingId === doctor.id || deletingId === doctor.id}
                      onClick={() => handleDelete(doctor)}
                    >
                      {deletingId === doctor.id ? "…" : "Supprimer"}
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

export default AdminDoctors;
