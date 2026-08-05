import { NavLink } from "react-router-dom";

function Sidebar() {
  const getLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

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

      <NavLink to="/connexion" className="sidebar-logout">
        Déconnexion
      </NavLink>
    </aside>
  );
}

export default Sidebar;