import { Link } from "react-router-dom";

function Register() {
  const handleSubmit = (event) => {
    event.preventDefault();
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstname">Prénom</label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  placeholder="Votre prénom"
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
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Type de compte</label>
              <select id="role" name="role" defaultValue="patient" required>
                <option value="patient">Patient</option>
                <option value="doctor">Médecin</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Mot de passe</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="8 caractères minimum"
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

            <button type="submit" className="auth-submit-button">
              Créer mon compte
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