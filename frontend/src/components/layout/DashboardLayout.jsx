// src/components/layout/DashboardLayout.jsx

import Sidebar from "./Sidebar";
import useAuth from "../../hooks/useAuth";

// Libellé affiché sous le nom, selon le rôle réel de l'utilisateur.
const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Médecin",
  admin: "Administrateur",
};

function DashboardLayout({ title, subtitle, children }) {
  const { user } = useAuth();

  const fullName = user ? `${user.firstname} ${user.lastname}` : "";

  const initials = user
    ? `${user.firstname[0]}${user.lastname[0]}`.toUpperCase()
    : "";

  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">Espace patient</p>
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

export default DashboardLayout;
