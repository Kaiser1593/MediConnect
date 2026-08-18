import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
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

const STATUS_BADGE_CLASSES = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "confirmed",
  cancelled: "cancelled",
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (time) => time.slice(0, 5).replace(":", " h ");

const todayIso = () => new Date().toISOString().slice(0, 10);

function AppointmentRow({ appointment, onCancel, isCancelling }) {
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="appointment-row">
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

      <span className={`status-badge ${STATUS_BADGE_CLASSES[appointment.status]}`}>
        {STATUS_LABELS[appointment.status]}
      </span>

      {canCancel ? (
        <button
          type="button"
          className="cancel-button"
          disabled={isCancelling}
          onClick={() => onCancel(appointment.id)}
        >
          {isCancelling ? "Annulation…" : "Annuler"}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/appointments");
        setAppointments(response.data.appointments);
      } catch {
        setError("Impossible de charger vos rendez-vous.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;

    setCancellingId(appointmentId);
    setError("");

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "L'annulation a échoué. Veuillez réessayer.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const today = todayIso();

  const upcoming = appointments
    .filter(
      (appointment) =>
        (appointment.status === "pending" || appointment.status === "confirmed") &&
        appointment.scheduled_on.slice(0, 10) >= today,
    )
    .reverse();

  const past = appointments.filter(
    (appointment) => !upcoming.includes(appointment),
  );

  return (
    <DashboardLayout
      role="Espace patient"
      title="Mes rendez-vous"
      subtitle="Retrouvez l'ensemble de vos consultations."
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
          <section className="dashboard-panel appointments-panel">
            <div className="panel-heading">
              <div>
                <h2>À venir</h2>
                <p>Vos prochaines consultations.</p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <p>Aucun rendez-vous à venir.</p>
            ) : (
              <div className="appointment-list">
                {upcoming.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    isCancelling={cancellingId === appointment.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel appointments-panel">
            <div className="panel-heading">
              <div>
                <h2>Historique</h2>
                <p>Rendez-vous passés, terminés ou annulés.</p>
              </div>
            </div>

            {past.length === 0 ? (
              <p>Aucun rendez-vous dans l'historique.</p>
            ) : (
              <div className="appointment-list">
                {past.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    isCancelling={cancellingId === appointment.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default MyAppointments;
