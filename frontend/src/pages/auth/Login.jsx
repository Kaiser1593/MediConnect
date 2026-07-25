import { Link } from "react-router-dom";

function Login() {
  const handleSubmit = (event) => {
    event.preventDefault();
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="exemple@email.fr"
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
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>

              <button type="button" className="forgot-password">
                Mot de passe oublié ?
              </button>
            </div>

            <button type="submit" className="auth-submit-button">
              Se connecter
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