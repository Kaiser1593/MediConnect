import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "patient",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

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

    setMessage({
      type: "",
      text: "",
    });

    // Contrôle côté navigateur pour un retour immédiat.
    // Le serveur refait la même vérification : elle seule fait foi.
    if (formData.password !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas.",
      });

      return;
    }

    try {
      setIsLoading(true);

      const response = await api.post("/auth/register", formData);
      const { token, user } = response.data;

      // Le compte est créé : on connecte directement l'utilisateur
      // plutôt que de le renvoyer vers le formulaire de connexion.
      login(token, user);

      navigate(
        user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard",
        { replace: true },
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-information">
          <p className="section-label">Créer un compte</p>

          <h1>Rejoignez MediConnect simplement</h1>

          <p>
            Créez votre compte afin de prendre rendez-vous avec un professionnel
            de santé ou de gérer votre activité en tant que médecin.
          </p>

          <div className="auth-benefits">
            <div>
              <span>✓</span>
              <p>Création de compte rapide</p>
            </div>

            <div>
              <span>✓</span>
              <p>Accès à un espace personnel sécurisé</p>
            </div>

            <div>
              <span>✓</span>
              <p>Gestion centralisée des rendez-vous</p>
            </div>
          </div>
        </div>

        <div className="auth-card register-auth-card">
          <div className="auth-card-heading">
            <h2>Créer un compte</h2>
            <p>Renseignez vos informations personnelles.</p>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstname">Prénom</label>

                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  placeholder="Votre prénom"
                  value={formData.firstname}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname">Nom</label>

                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  placeholder="Votre nom"
                  value={formData.lastname}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Adresse e-mail</label>

              <input
                id="register-email"
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
              <label htmlFor="role">Type de compte</label>

              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="patient">Patient</option>
                <option value="doctor">Médecin</option>
              </select>
            </div>

            {formData.role === "doctor" && (
              <p className="form-hint">
                Votre compte médecin devra être validé par notre équipe avant
                d’apparaître dans les résultats de recherche.
              </p>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Mot de passe</label>

                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="8 caractères minimum"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>
            </div>

            <label className="terms-checkbox">
              <input type="checkbox" required />

              <span>
                J’accepte les conditions d’utilisation et la politique de
                confidentialité.
              </span>
            </label>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-switch">
            Vous possédez déjà un compte ?{" "}
            <Link to="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
