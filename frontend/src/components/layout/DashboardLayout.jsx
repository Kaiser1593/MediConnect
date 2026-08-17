// src/components/layout/DemoLayout.jsx

import { Link, NavLink, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

// Libellé affiché sous le nom de l'utilisateur.
// Distinct de la prop "role", qui sert de titre à la sidebar
// ("Espace médecin") et ne convient pas à cet emplacement.
const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Médecin",
  admin: "Administrateur",
};

function DemoLayout({ role, title, subtitle, menu, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  const fullName = user ? `${user.firstname} ${user.lastname}` : "";

  const initials = user
    ? `${user.firstname[0]}${user.lastname[0]}`.toUpperCase()
    : "";

  const roleLabel = user ? ROLE_LABELS[user.role] || "" : "";

  const handleLogout = () => {
    logout();
    navigate("/connexion", { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          Medi<span>Connect</span>
        </Link>

        <nav className="sidebar-navigation">
          <p className="sidebar-section-title">{role}</p>

          {menu.map((item) => (
            <NavLink key={item.path} to={item.path} className={getLinkClass}>
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

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">{role}</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>

          <div className="dashboard-user">
            <div>
              <strong>{fullName}</strong>
              <span>{roleLabel}</span>
            </div>

            <div className="dashboard-avatar">{initials}</div>
          </div>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}

export default DemoLayout;
