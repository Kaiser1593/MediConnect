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

const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

const formatTime = (time) => time.slice(0, 5).replace(":", " h ");

function DoctorAvailabilities() {
  const [availabilities, setAvailabilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    weekday: "1",
    startTime: "09:00",
    endTime: "12:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reloadIndex change relance l'effet : c'est ainsi que handleSubmit
  // déclenche un nouveau chargement après l'ajout d'un créneau.
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    const loadAvailabilities = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/doctors/me/availabilities");
        setAvailabilities(response.data.availabilities);
      } catch {
        setError("Impossible de charger vos disponibilités.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailabilities();
  }, [reloadIndex]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/doctors/me/availabilities", {
        weekday: Number(formData.weekday),
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      setReloadIndex((previous) => previous + 1);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "L'ajout a échoué.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError("");

    try {
      await api.delete(`/doctors/me/availabilities/${id}`);
      setAvailabilities((previous) =>
        previous.filter((availability) => availability.id !== id),
      );
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
      role="Espace médecin"
      title="Disponibilités"
      subtitle="Gérez vos horaires récurrents de consultation."
      menu={menu}
    >
      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Ajouter un créneau récurrent</h2>
            <p>Il sera proposé chaque semaine aux patients.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weekday">Jour</label>
              <select
                id="weekday"
                name="weekday"
                value={formData.weekday}
                onChange={handleChange}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Début</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Fin</label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-dashboard-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ajout…" : "Ajouter ce créneau"}
          </button>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Vos créneaux actuels</h2>
            <p>Triés par jour de la semaine.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="route-loading">Chargement…</p>
        ) : availabilities.length === 0 ? (
          <p>Aucune disponibilité enregistrée pour le moment.</p>
        ) : (
          <div className="availability-list">
            {availabilities.map((availability) => {
              const weekdayLabel =
                WEEKDAYS.find((day) => day.value === availability.weekday)?.label ||
                "";

              return (
                <div key={availability.id}>
                  <span>{weekdayLabel}</span>
                  <strong>
                    {formatTime(availability.start_time)} –{" "}
                    {formatTime(availability.end_time)}
                  </strong>

                  <button
                    type="button"
                    className="cancel-button"
                    disabled={deletingId === availability.id}
                    onClick={() => handleDelete(availability.id)}
                  >
                    {deletingId === availability.id ? "…" : "Supprimer"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default DoctorAvailabilities;
