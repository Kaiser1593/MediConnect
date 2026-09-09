// src/components/layout/Sidebar.jsx
// Navigation latérale des trois espaces protégés (patient, médecin,
// administrateur), extraite de DashboardLayout.jsx : celui-ci garde
// l'état (ouverture mobile, ref pour le piège de focus) et la logique de
// déconnexion, Sidebar n'est responsable que de l'affichage.

import { Link, NavLink } from "react-router-dom";

const getLinkClass = ({ isActive }) =>
  isActive ? "sidebar-link active" : "sidebar-link";

function Sidebar({ role, menu, isMobileMenuOpen, sidebarRef, onClose, onLogout }) {
  return (
    <>
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar${isMobileMenuOpen ? " mobile-open" : ""}`}
      >
        <div className="sidebar-top">
          <Link to="/" className="sidebar-logo" onClick={onClose}>
            Medi<span>Connect</span>
          </Link>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-navigation">
          <p className="sidebar-section-title">{role}</p>

          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={getLinkClass}
              onClick={onClose}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-help">
          <strong>Besoin d’aide ?</strong>
          <p>Notre assistance est disponible pour vous accompagner.</p>
          <button type="button">Contacter l’assistance</button>
        </div>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          Déconnexion
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
