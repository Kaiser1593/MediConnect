import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

const times = [
  "09 h 00",
  "09 h 30",
  "10 h 00",
  "11 h 30",
  "14 h 00",
  "14 h 30",
  "15 h 30",
  "16 h 00",
];

function AppointmentBooking() {
  const [selectedTime, setSelectedTime] = useState("14 h 30");
  const [confirmed, setConfirmed] = useState(false);

  const menu = [
    { label: "Tableau de bord", path: "/patient/dashboard", icon: "⌂" },
    { label: "Rechercher un médecin", path: "/patient/medecins", icon: "＋" },
    { label: "Mes rendez-vous", path: "/patient/rendez-vous", icon: "□" },
    { label: "Mon profil", path: "/patient/profil", icon: "○" },
  ];

  return (
    <DashboardLayout
      role="Espace patient"
      title="Réserver un rendez-vous"
      subtitle="Choisissez une date et un horaire disponibles."
      menu={menu}
    >
      {confirmed && (
        <div className="booking-success">
          Rendez-vous confirmé avec le Dr Sarah Martin pour le 12 août 2026 à{" "}
          {selectedTime}.
        </div>
      )}

      <section className="booking-grid">
        <article className="dashboard-panel">
          <div className="booking-doctor">
            <div className="large-avatar">SM</div>

            <div>
              <h2>Dr Sarah Martin</h2>
              <p>Médecin généraliste</p>
              <span>★★★★★ 4,9 · Paris 11e</span>
            </div>
          </div>

          <div className="booking-section">
            <h3>1. Sélectionnez une date</h3>

            <div className="date-cards">
              <button type="button">
                <span>Lun.</span>
                <strong>10</strong>
                <small>Août</small>
              </button>

              <button type="button">
                <span>Mar.</span>
                <strong>11</strong>
                <small>Août</small>
              </button>

              <button type="button" className="selected">
                <span>Mer.</span>
                <strong>12</strong>
                <small>Août</small>
              </button>

              <button type="button">
                <span>Jeu.</span>
                <strong>13</strong>
                <small>Août</small>
              </button>

              <button type="button">
                <span>Ven.</span>
                <strong>14</strong>
                <small>Août</small>
              </button>
            </div>
          </div>

          <div className="booking-section">
            <h3>2. Sélectionnez un horaire</h3>

            <div className="time-grid">
              {times.map((time) => (
                <button
                  type="button"
                  key={time}
                  className={selectedTime === time ? "selected" : ""}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-section">
            <h3>3. Motif de consultation</h3>

            <select defaultValue="consultation">
              <option value="consultation">Consultation générale</option>
              <option value="follow-up">Consultation de suivi</option>
              <option value="certificate">Certificat médical</option>
              <option value="urgent">Douleur ou urgence relative</option>
            </select>

            <textarea
              placeholder="Vous pouvez apporter des précisions au médecin..."
              rows="4"
            />
          </div>
        </article>

        <aside className="dashboard-panel booking-summary">
          <h2>Résumé du rendez-vous</h2>

          <div>
            <span>Professionnel</span>
            <strong>Dr Sarah Martin</strong>
          </div>

          <div>
            <span>Spécialité</span>
            <strong>Médecin généraliste</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>12 août 2026</strong>
          </div>

          <div>
            <span>Horaire</span>
            <strong>{selectedTime}</strong>
          </div>

          <div>
            <span>Lieu</span>
            <strong>Paris 11e</strong>
          </div>

          <div>
            <span>Tarif</span>
            <strong>30 €</strong>
          </div>

          <button
            type="button"
            className="primary-dashboard-button"
            onClick={() => setConfirmed(true)}
          >
            Confirmer le rendez-vous
          </button>

          <p>
            Aucun paiement ne sera effectué lors de la réservation.
          </p>
        </aside>
      </section>
    </DashboardLayout>
  );
}

export default AppointmentBooking;