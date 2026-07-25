import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        Medi<span>Connect</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/">Accueil</Link>
        <a href="#services">Services</a>
        <a href="#fonctionnement">Fonctionnement</a>
        <Link to="/connexion">Connexion</Link>
        <Link to="/inscription" className="navbar-button">
          Inscription
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;