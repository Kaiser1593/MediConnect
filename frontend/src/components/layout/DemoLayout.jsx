import { Link, NavLink } from "react-router-dom";

function DemoLayout({
  role,
  userName,
  initials,
  title,
  subtitle,
  menu,
  children,
}) {
  const getLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          Medi<span>Connect</span>
        </Link>

        <nav className="sidebar-navigation">
          <p className="sidebar-section-title">{role}</p>

          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={getLinkClass}
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

        <Link to="/connexion" className="sidebar-logout">
          Déconnexion
        </Link>
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
              <strong>{userName}</strong>
              <span>{role}</span>
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