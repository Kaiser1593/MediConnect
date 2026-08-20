import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });

    try {
      setIsLoading(true);

      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;

      login(token, user);

      // Si l'utilisateur avait tenté d'ouvrir une page protégée,
      // on l'y renvoie. Sinon, direction son espace selon son rôle.
      const redirectTo =
        location.state?.from?.pathname ||
        {
          patient: "/patient/dashboard",
          doctor: "/doctor/dashboard",
          admin: "/admin/dashboard",
        }[user.role] ||
        "/";

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Une erreur est survenue pendant la connexion.";

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-information">
          <p className="section-label">Connexion sécurisée</p>

          <h1>Retrouvez votre espace MediConnect</h1>

          <p>
            Connectez-vous pour consulter vos rendez-vous, gérer votre profil
            et accéder aux fonctionnalités adaptées à votre compte.
          </p>

          <div className="auth-benefits">
            <div>
              <span>✓</span>
              <p>Accès rapide à vos rendez-vous</p>
            </div>

            <div>
              <span>✓</span>
              <p>Gestion sécurisée de vos informations</p>
            </div>

            <div>
              <span>✓</span>
              <p>Interface adaptée aux patients et aux médecins</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Se connecter</h2>
            <p>Renseignez vos identifiants pour accéder à votre compte.</p>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Adresse e-mail</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="exemple@email.fr"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="auth-switch">
            Vous n’avez pas encore de compte ?{" "}
            <Link to="/inscription">Créer un compte</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
