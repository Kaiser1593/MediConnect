import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

const menu = [
  { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
  { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
  { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
  { label: "Mon profil", path: "/patient/profil", icon: "○" },
];

const REASON_LABELS = {
  consultation: "Consultation générale",
  "follow-up": "Consultation de suivi",
  certificate: "Certificat médical",
  urgent: "Douleur ou urgence relative",
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Format local (pas toISOString) : évite un décalage de date selon le
// fuseau horaire, contrairement à une conversion en UTC.
const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (time) => time.replace(":", " h ");

const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

function AppointmentBooking() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  // Présent uniquement quand on arrive depuis "Replanifier" (Mes rendez-vous) :
  // même parcours de sélection date/horaire, mais on modifie un rendez-vous
  // existant au lieu d'en créer un nouveau.
  const rescheduleId = searchParams.get("replanifier");

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);

      return {
        iso: toIsoDate(date),
        weekday: capitalize(date.toLocaleDateString("fr-FR", { weekday: "short" })),
        day: date.getDate(),
        month: capitalize(date.toLocaleDateString("fr-FR", { month: "short" })),
      };
    });
  }, []);

  const [doctor, setDoctor] = useState(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  const [reviews, setReviews] = useState([]);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [selectedTime, setSelectedTime] = useState(null);

  const [reasonType, setReasonType] = useState("consultation");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    const loadDoctor = async () => {
      setIsLoadingDoctor(true);
      setDoctorError("");

      try {
        const response = await api.get(`/doctors/${doctorId}`);
        setDoctor(response.data.doctor);
      } catch {
        setDoctorError("Ce médecin est introuvable ou n'est plus disponible.");
      } finally {
        setIsLoadingDoctor(false);
      }
    };

    loadDoctor();
  }, [doctorId]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await api.get(`/doctors/${doctorId}/reviews`);
        setReviews(response.data.reviews);
      } catch {
        setReviews([]);
      }
    };

    loadReviews();
  }, [doctorId]);

  useEffect(() => {
    const loadSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedTime(null);

      try {
        const response = await api.get(`/doctors/${doctorId}/availability`, {
          params: { date: selectedDate },
        });
        setSlots(response.data.slots);
      } catch {
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadSlots();
  }, [doctorId, selectedDate]);

  const handleConfirm = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    const reason = note.trim()
      ? `${REASON_LABELS[reasonType]} - ${note.trim()}`
      : REASON_LABELS[reasonType];

    try {
      if (rescheduleId) {
        await api.patch(`/appointments/${rescheduleId}/reschedule`, {
          scheduledOn: selectedDate,
          startTime: selectedTime,
          reason,
        });
      } else {
        await api.post("/appointments", {
          doctorId: Number(doctorId),
          scheduledOn: selectedDate,
          startTime: selectedTime,
          reason,
        });
      }

      setConfirmed({ date: selectedDate, time: selectedTime });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          (rescheduleId
            ? "La replanification a échoué. Veuillez réessayer."
            : "La réservation a échoué. Veuillez réessayer."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = rescheduleId ? "Replanifier le rendez-vous" : "Réserver un rendez-vous";

  if (isLoadingDoctor) {
    return (
      <DashboardLayout
        role="Espace patient"
        title={pageTitle}
        subtitle="Choisissez une date et un horaire disponibles."
        menu={menu}
      >
        <p className="route-loading">Chargement…</p>
      </DashboardLayout>
    );
  }

  if (doctorError || !doctor) {
    return (
      <DashboardLayout
        role="Espace patient"
        title={pageTitle}
        subtitle="Choisissez une date et un horaire disponibles."
        menu={menu}
      >
        <div className="form-message error" role="alert">
          {doctorError}
        </div>
      </DashboardLayout>
    );
  }

  const selectedDateOption = dateOptions.find((option) => option.iso === selectedDate);

  return (
    <DashboardLayout
      role="Espace patient"
      title={pageTitle}
      subtitle="Choisissez une date et un horaire disponibles."
      menu={menu}
    >
      {confirmed && (
        <div className="booking-success">
          {rescheduleId ? "Rendez-vous replanifié avec le" : "Rendez-vous confirmé avec le"}{" "}
          {doctor.full_name} pour le{" "}
          {capitalize(
            new Date(`${confirmed.date}T00:00:00`).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          )}{" "}
          à {formatTime(confirmed.time)}.
        </div>
      )}

      {!confirmed && (
        <section className="booking-grid">
          <article className="dashboard-panel">
            <div className="booking-doctor">
              <div className="large-avatar">
                {`${doctor.firstname[0]}${doctor.lastname[0]}`.toUpperCase()}
              </div>

              <div>
                <h2>{doctor.full_name}</h2>
                <p>{doctor.specialty || "Spécialité non renseignée"}</p>
                <span>
                  {doctor.average_rating
                    ? `★★★★★ ${doctor.average_rating} · ${doctor.city || ""}`
                    : doctor.city || ""}
                </span>
              </div>
            </div>

            <div className="booking-section">
              <h3>1. Sélectionnez une date</h3>

              <div className="date-cards">
                {dateOptions.map((option) => (
                  <button
                    type="button"
                    key={option.iso}
                    className={selectedDate === option.iso ? "selected" : ""}
                    onClick={() => setSelectedDate(option.iso)}
                  >
                    <span>{option.weekday}</span>
                    <strong>{option.day}</strong>
                    <small>{option.month}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-section">
              <h3>2. Sélectionnez un horaire</h3>

              {isLoadingSlots ? (
                <p>Chargement des créneaux…</p>
              ) : slots.length === 0 ? (
                <p>Aucun créneau disponible à cette date.</p>
              ) : (
                <div className="time-grid">
                  {slots.map((time) => (
                    <button
                      type="button"
                      key={time}
                      className={selectedTime === time ? "selected" : ""}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="booking-section">
              <h3>3. Motif de consultation</h3>

              <select value={reasonType} onChange={(event) => setReasonType(event.target.value)}>
                <option value="consultation">Consultation générale</option>
                <option value="follow-up">Consultation de suivi</option>
                <option value="certificate">Certificat médical</option>
                <option value="urgent">Douleur ou urgence relative</option>
              </select>

              <textarea
                placeholder="Vous pouvez apporter des précisions au médecin..."
                rows="4"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {reviews.length > 0 && (
              <div className="booking-section">
                <h3>Avis des patients</h3>

                <div className="review-list">
                  {reviews.map((review) => (
                    <div className="review-item" key={review.id}>
                      <div>
                        <strong>
                          {review.firstname} {review.lastname[0]}.
                        </strong>
                        <span className="review-rating-display">
                          {renderStars(review.rating)}
                        </span>
                      </div>

                      {review.comment && <p>{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="dashboard-panel booking-summary">
            <h2>Résumé du rendez-vous</h2>

            <div>
              <span>Professionnel</span>
              <strong>{doctor.full_name}</strong>
            </div>

            <div>
              <span>Spécialité</span>
              <strong>{doctor.specialty || "—"}</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>
                {selectedDateOption
                  ? `${selectedDateOption.day} ${selectedDateOption.month}`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Horaire</span>
              <strong>{selectedTime ? formatTime(selectedTime) : "—"}</strong>
            </div>

            <div>
              <span>Lieu</span>
              <strong>{doctor.city || "—"}</strong>
            </div>

            <div>
              <span>Tarif</span>
              <strong>
                {doctor.consultation_price ? `${Number(doctor.consultation_price)} €` : "—"}
              </strong>
            </div>

            {submitError && (
              <div className="form-message error" role="alert">
                {submitError}
              </div>
            )}

            <button
              type="button"
              className="primary-dashboard-button"
              onClick={handleConfirm}
              disabled={!selectedTime || isSubmitting}
            >
              {isSubmitting
                ? "Confirmation…"
                : rescheduleId
                  ? "Replanifier le rendez-vous"
                  : "Confirmer le rendez-vous"}
            </button>

            <p>Aucun paiement ne sera effectué lors de la réservation.</p>
          </aside>
        </section>
      )}
    </DashboardLayout>
  );
}

export default AppointmentBooking;
