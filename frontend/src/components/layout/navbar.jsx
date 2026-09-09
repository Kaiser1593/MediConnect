import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        Medi<span>Connect</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/">Accueil</Link>
        <Link to="/#services">Services</Link>
        <Link to="/#fonctionnement">Fonctionnement</Link>
        <Link to="/connexion">Connexion</Link>
        <Link to="/inscription" className="navbar-button">
          Inscription
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;