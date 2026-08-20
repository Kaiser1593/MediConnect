import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });

    // Contrôle côté navigateur pour un retour immédiat.
    // Le serveur refait la même vérification : elle seule fait foi.
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });

      setMessage({ type: "success", text: response.data.message });
      setIsDone(true);

      setTimeout(() => navigate("/connexion"), 2500);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-information">
          <p className="section-label">Nouveau mot de passe</p>

          <h1>Choisissez un nouveau mot de passe</h1>

          <p>Ce lien n’est valable qu’une heure et ne peut être utilisé qu’une seule fois.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Réinitialisation</h2>
            <p>Renseignez votre nouveau mot de passe.</p>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {!isDone && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>

                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="8 caractères minimum"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Validation..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            {isDone ? (
              "Redirection vers la connexion..."
            ) : (
              <>
                Lien expiré ou invalide ?{" "}
                <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
