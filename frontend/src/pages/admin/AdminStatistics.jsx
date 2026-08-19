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

const ROLE_LABELS = {
  patient: "Patients",
  doctor: "Médecins",
  admin: "Administrateurs",
};

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

function AdminStatistics() {
  const [usersByRole, setUsersByRole] = useState([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState([]);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStatistics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/statistics");
        setUsersByRole(response.data.usersByRole);
        setAppointmentsByStatus(response.data.appointmentsByStatus);
        setDoctorsBySpecialty(response.data.doctorsBySpecialty);
      } catch {
        setError("Impossible de charger les statistiques.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStatistics();
  }, []);

  return (
    <DashboardLayout
      role="Administration"
      title="Statistiques"
      subtitle="Répartitions réelles calculées à partir de la base de données."
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
            {usersByRole.map((item) => (
              <article className="stat-card" key={item.role}>
                <div className="stat-icon">○</div>
                <div>
                  <span>{ROLE_LABELS[item.role] || item.role}</span>
                  <strong>{item.total}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-overview">
            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Rendez-vous par statut</h2>
                  <p>Toutes périodes confondues.</p>
                </div>
              </div>

              {appointmentsByStatus.length === 0 ? (
                <p>Aucun rendez-vous enregistré.</p>
              ) : (
                <div className="availability-list">
                  {appointmentsByStatus.map((item) => (
                    <div key={item.status}>
                      <span>{STATUS_LABELS[item.status] || item.status}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <aside className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Médecins par spécialité</h2>
                  <p>Répartition actuelle.</p>
                </div>
              </div>

              {doctorsBySpecialty.length === 0 ? (
                <p>Aucun médecin enregistré.</p>
              ) : (
                <div className="availability-list">
                  {doctorsBySpecialty.map((item) => (
                    <div key={item.specialty}>
                      <span>{item.specialty}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminStatistics;
