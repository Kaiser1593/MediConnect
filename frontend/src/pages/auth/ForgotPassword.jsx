import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });
    setIsLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });

      // Message volontairement identique côté serveur que le compte
      // existe ou non : on l'affiche tel quel.
      setMessage({ type: "success", text: response.data.message });
      setIsSent(true);
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
          <p className="section-label">Mot de passe oublié</p>

          <h1>Récupérez l’accès à votre compte</h1>

          <p>
            Indiquez votre adresse e-mail : si un compte MediConnect y est
            associé, vous recevrez un lien pour choisir un nouveau mot de
            passe.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Réinitialiser mon mot de passe</h2>
            <p>Valable une heure après réception de l’e-mail.</p>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {!isSent && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Adresse e-mail</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemple@email.fr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link to="/connexion">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
