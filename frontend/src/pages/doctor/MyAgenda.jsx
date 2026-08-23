import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Avatar from "../../components/common/Avatar";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/doctor/dashboard", icon: "⌂" },
  { label: "Mon agenda", path: "/doctor/agenda", icon: "□" },
  { label: "Mes patients", path: "/doctor/patients", icon: "○" },
  { label: "Disponibilités", path: "/doctor/disponibilites", icon: "＋" },
  { label: "Mon profil", path: "/doctor/profil", icon: "⚙" },
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

function AgendaRow({
  appointment,
  onCancel,
  onConfirm,
  onComplete,
  isCancelling,
  isConfirming,
  isCompleting,
}) {
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";
  const isBusy = isCancelling || isConfirming || isCompleting;
  // Marquer une consultation "terminée" n'a de sens qu'une fois qu'elle a
  // vraiment eu lieu : comparer uniquement la date ne suffit pas, un
  // rendez-vous prévu plus tard aujourd'hui n'a pas encore eu lieu.
  const appointmentDateTime = new Date(
    `${appointment.scheduled_on.slice(0, 10)}T${appointment.start_time}`,
  );
  const canComplete =
    appointment.status === "confirmed" && appointmentDateTime <= new Date();

  return (
    <div className="doctor-appointment-row">
      <div className="appointment-time-block">
        <strong>{formatDate(appointment.scheduled_on)}</strong>
        <span>{formatTime(appointment.start_time)}</span>
      </div>

      <div className="appointment-doctor">
        <Avatar
          avatarUrl={appointment.avatar_url}
          firstname={appointment.firstname}
          lastname={appointment.lastname}
        />

        <div>
          <strong>
            {appointment.firstname} {appointment.lastname}
          </strong>
          <span>{appointment.reason || "Motif non précisé"}</span>
        </div>
      </div>

      <span className={`status-badge ${STATUS_BADGE_CLASSES[appointment.status]}`}>
        {STATUS_LABELS[appointment.status]}
      </span>

      <div className="row-actions">
        {appointment.status === "pending" && (
          <button
            type="button"
            className="outline-button"
            disabled={isBusy}
            onClick={() => onConfirm(appointment.id)}
          >
            {isConfirming ? "…" : "Confirmer"}
          </button>
        )}

        {canComplete && (
          <button
            type="button"
            className="outline-button"
            disabled={isBusy}
            onClick={() => onComplete(appointment.id)}
          >
            {isCompleting ? "…" : "Terminer"}
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className="cancel-button"
            disabled={isBusy}
            onClick={() => onCancel(appointment.id)}
          >
            {isCancelling ? "…" : "Annuler"}
          </button>
        )}
      </div>
    </div>
  );
}

function MyAgenda() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/appointments");
        setAppointments(response.data.appointments);
      } catch {
        setError("Impossible de charger votre agenda.");
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

  const handleConfirm = async (appointmentId) => {
    setConfirmingId(appointmentId);
    setError("");

    try {
      await api.patch(`/appointments/${appointmentId}/confirm`);
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "confirmed" }
            : appointment,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "La confirmation a échoué. Veuillez réessayer.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const handleComplete = async (appointmentId) => {
    // "Annuler" sur cette fenêtre ne doit annuler que la saisie de la
    // note, jamais la clôture elle-même : c'est un ajout facultatif.
    const doctorNotes = window.prompt(
      "Compte rendu (facultatif, visible de vous seul) :",
      "",
    );

    setCompletingId(appointmentId);
    setError("");

    try {
      await api.patch(`/appointments/${appointmentId}/complete`, {
        doctorNotes: doctorNotes || undefined,
      });
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "completed" }
            : appointment,
        ),
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "La clôture a échoué. Veuillez réessayer.",
      );
    } finally {
      setCompletingId(null);
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
      role="Espace médecin"
      title="Mon agenda"
      subtitle="Retrouvez l'ensemble de vos rendez-vous."
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
                <p>Vos prochains rendez-vous.</p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <p>Aucun rendez-vous à venir.</p>
            ) : (
              <div className="appointment-list">
                {upcoming.map((appointment) => (
                  <AgendaRow
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    onComplete={handleComplete}
                    isCancelling={cancellingId === appointment.id}
                    isConfirming={confirmingId === appointment.id}
                    isCompleting={completingId === appointment.id}
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
                  <AgendaRow
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    onComplete={handleComplete}
                    isCancelling={cancellingId === appointment.id}
                    isConfirming={confirmingId === appointment.id}
                    isCompleting={completingId === appointment.id}
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

export default MyAgenda;
