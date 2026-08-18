import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/doctor/dashboard", icon: "⌂" },
  { label: "Mon agenda", path: "/doctor/agenda", icon: "□" },
  { label: "Mes patients", path: "/doctor/patients", icon: "○" },
  { label: "Disponibilités", path: "/doctor/disponibilites", icon: "＋" },
  { label: "Mon profil", path: "/doctor/profil", icon: "⚙" },
];

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/doctors/me/patients");
        setPatients(response.data.patients);
      } catch {
        setError("Impossible de charger la liste de vos patients.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  return (
    <DashboardLayout
      role="Espace médecin"
      title="Mes patients"
      subtitle="Les patients qui ont pris rendez-vous avec vous."
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
            <h2>Tous vos patients</h2>
            <p>{patients.length} patient(s) au total.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : patients.length === 0 ? (
          <p>Aucun patient pour le moment.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Patient</span>
              <span>Adresse e-mail</span>
              <span>Téléphone</span>
              <span>Dernier rendez-vous</span>
              <span>Consultations</span>
            </div>

            {patients.map((patient) => (
              <div className="admin-table-row" key={patient.patient_id}>
                <strong>
                  {patient.firstname} {patient.lastname}
                </strong>
                <span>{patient.email}</span>
                <span>{patient.phone || "—"}</span>
                <span>{formatDate(patient.last_appointment)}</span>
                <span>{patient.appointment_count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default DoctorPatients;
