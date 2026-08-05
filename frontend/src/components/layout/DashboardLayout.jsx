import Sidebar from "./Sidebar";

function DashboardLayout({ title, subtitle, children }) {
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
              <strong>Kaïs Padrines</strong>
              <span>Patient</span>
            </div>

            <div className="dashboard-avatar">KP</div>
          </div>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;