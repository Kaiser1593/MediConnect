// src/components/layout/Sidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  // Un simple lien vers /connexion ne déconnectait personne :
  // le token restait en place et l'utilisateur restait authentifié.
  const handleLogout = () => {
    logout();
    navigate("/connexion", { replace: true });
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo">
        Medi<span>Connect</span>
      </NavLink>

      <nav className="sidebar-navigation">
        <p className="sidebar-section-title">Navigation</p>

        <NavLink to="/patient/dashboard" className={getLinkClass}>
          <span>⌂</span>
          Tableau de bord
        </NavLink>

        <NavLink to="/patient/medecins" className={getLinkClass}>
          <span>＋</span>
          Rechercher un médecin
        </NavLink>

        <NavLink to="/patient/rendez-vous" className={getLinkClass}>
          <span>□</span>
          Mes rendez-vous
        </NavLink>

        <NavLink to="/patient/profil" className={getLinkClass}>
          <span>○</span>
          Mon profil
        </NavLink>
      </nav>

      <div className="sidebar-help">
        <strong>Besoin d’aide ?</strong>
        <p>Notre assistance est disponible pour vous accompagner.</p>
        <button type="button">Contacter l’assistance</button>
      </div>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        Déconnexion
      </button>
    </aside>
  );
}

export default Sidebar;
