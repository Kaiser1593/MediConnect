// src/components/layout/DashboardLayout.jsx
// Layout commun aux trois espaces protégés (patient, médecin, administrateur).
// La sidebar affiche le menu et le rôle passés en props par la page appelante.

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Libellé affiché sous le nom de l'utilisateur.
// Distinct de la prop "role", qui sert de titre à la sidebar
// ("Espace médecin") et ne convient pas à cet emplacement.
const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Médecin",
  admin: "Administrateur",
};

function DashboardLayout({ role, title, subtitle, menu, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuToggleRef = useRef(null);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    // Rend la main au bouton qui a ouvert le menu : un utilisateur au
    // clavier ne se retrouve jamais avec le focus perdu au milieu de la
    // page après une fermeture (Échap, clic sur un lien, sur le fond...).
    menuToggleRef.current?.focus();
  };

  // En dessous de 900px, la sidebar devient un panneau qui recouvre
  // l'écran plutôt que de disparaître (voir App.css) : sans ce contrôle,
  // la navigation de tout l'espace patient/médecin/administrateur serait
  // inaccessible sur mobile et tablette. Tant qu'il est ouvert, le focus
  // clavier est piégé à l'intérieur (Tab ne doit pas atteindre le
  // contenu masqué par le fond assombri).
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar
      ? Array.from(sidebar.querySelectorAll(FOCUSABLE_SELECTOR))
      : [];

    // Attend la fin de la transition d'ouverture (voir App.css) avant de
    // déplacer le focus : certains navigateurs ignorent .focus() sur un
    // élément qui vient tout juste de devenir visible. Le délai de repli
    // couvre le cas où la transition ne se déclenche pas (mouvement
    // réduit, focus posé alors que la page est encore en train de finir
    // de se monter).
    const focusFirstElement = () => focusableElements[0]?.focus();
    sidebar.addEventListener("transitionend", focusFirstElement, { once: true });
    const fallbackFocusTimer = setTimeout(focusFirstElement, 400);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      sidebar.removeEventListener("transitionend", focusFirstElement);
      clearTimeout(fallbackFocusTimer);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="dashboard-layout">
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar${isMobileMenuOpen ? " mobile-open" : ""}`}
      >
        <div className="sidebar-top">
          <Link to="/" className="sidebar-logo" onClick={closeMobileMenu}>
            Medi<span>Connect</span>
          </Link>

          <button
            type="button"
            className="sidebar-close"
            onClick={closeMobileMenu}
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
              onClick={closeMobileMenu}
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

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <button
            ref={menuToggleRef}
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={isMobileMenuOpen}
          >
            ☰
          </button>

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

            <div className="dashboard-avatar" aria-hidden="true">
              {initials}
            </div>
          </div>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
