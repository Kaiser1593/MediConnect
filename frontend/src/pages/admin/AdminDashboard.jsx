import DemoLayout from "../../components/layout/DemoLayout";

const users = [
  {
    name: "Jean Dupont",
    email: "jean.dupont@email.fr",
    role: "Patient",
    date: "12/08/2026",
    status: "Actif",
  },
  {
    name: "Dr Sarah Martin",
    email: "sarah.martin@email.fr",
    role: "Médecin",
    date: "10/08/2026",
    status: "Actif",
  },
  {
    name: "Sophie Leroy",
    email: "sophie.leroy@email.fr",
    role: "Patient",
    date: "09/08/2026",
    status: "Actif",
  },
  {
    name: "Dr Lucas Bernard",
    email: "lucas.bernard@email.fr",
    role: "Médecin",
    date: "08/08/2026",
    status: "En attente",
  },
];

function AdminDashboard() {
  const menu = [
    { label: "Tableau de bord", path: "/admin/dashboard", icon: "⌂" },
    { label: "Utilisateurs", path: "/admin/utilisateurs", icon: "○" },
    { label: "Médecins", path: "/admin/medecins", icon: "＋" },
    { label: "Rendez-vous", path: "/admin/rendez-vous", icon: "□" },
    { label: "Statistiques", path: "/admin/statistiques", icon: "▥" },
    { label: "Paramètres", path: "/admin/parametres", icon: "⚙" },
  ];

  return (
    <DemoLayout
      role="Administration"
      title="Tableau de bord administrateur"
      subtitle="Supervisez l’activité globale de MediConnect."
      menu={menu}
    >
      <section className="dashboard-statistics">
        <article className="stat-card">
          <div className="stat-icon">○</div>
          <div>
            <span>Utilisateurs inscrits</span>
            <strong>1 248</strong>
            <p>+68 ce mois-ci</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">＋</div>
          <div>
            <span>Médecins actifs</span>
            <strong>84</strong>
            <p>6 validations en attente</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">□</div>
          <div>
            <span>Rendez-vous planifiés</span>
            <strong>326</strong>
            <p>Cette semaine</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">✓</div>
          <div>
            <span>Taux de confirmation</span>
            <strong>94 %</strong>
            <p>+3 % depuis juillet</p>
          </div>
        </article>
      </section>

      <section className="admin-overview">
        <article className="dashboard-panel admin-chart">
          <div className="panel-heading">
            <div>
              <h2>Évolution des inscriptions</h2>
              <p>Nombre de nouveaux utilisateurs sur six mois.</p>
            </div>

            <select defaultValue="six-months">
              <option value="six-months">6 derniers mois</option>
            </select>
          </div>

          <div className="fake-chart">
            <div style={{ height: "38%" }}>
              <span>Mars</span>
            </div>
            <div style={{ height: "52%" }}>
              <span>Avril</span>
            </div>
            <div style={{ height: "47%" }}>
              <span>Mai</span>
            </div>
            <div style={{ height: "68%" }}>
              <span>Juin</span>
            </div>
            <div style={{ height: "82%" }}>
              <span>Juillet</span>
            </div>
            <div style={{ height: "100%" }}>
              <span>Août</span>
            </div>
          </div>
        </article>

        <aside className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Activité récente</h2>
              <p>Dernières actions sur la plateforme.</p>
            </div>
          </div>

          <div className="activity-list">
            <div>
              <span className="activity-icon">＋</span>
              <p>
                <strong>Nouveau médecin inscrit</strong>
                <small>Dr Lucas Bernard · il y a 12 min</small>
              </p>
            </div>

            <div>
              <span className="activity-icon">□</span>
              <p>
                <strong>Nouveau rendez-vous</strong>
                <small>Jean Dupont · il y a 28 min</small>
              </p>
            </div>

            <div>
              <span className="activity-icon">✓</span>
              <p>
                <strong>Compte médecin validé</strong>
                <small>Dr Emma Robert · il y a 1 h</small>
              </p>
            </div>

            <div>
              <span className="activity-icon">○</span>
              <p>
                <strong>Nouvel utilisateur</strong>
                <small>Sophie Leroy · il y a 2 h</small>
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="dashboard-panel admin-users-panel">
        <div className="panel-heading">
          <div>
            <h2>Derniers utilisateurs inscrits</h2>
            <p>Comptes récemment créés sur MediConnect.</p>
          </div>

          <button type="button" className="outline-button">
            Gérer les utilisateurs
          </button>
        </div>

        <div className="admin-table">
          <div className="admin-table-header">
            <span>Utilisateur</span>
            <span>Adresse e-mail</span>
            <span>Rôle</span>
            <span>Inscription</span>
            <span>Statut</span>
          </div>

          {users.map((user) => (
            <div className="admin-table-row" key={user.email}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span>{user.role}</span>
              <span>{user.date}</span>

              <span
                className={`status-badge ${
                  user.status === "Actif" ? "confirmed" : "pending"
                }`}
              >
                {user.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </DemoLayout>
  );
}

export default AdminDashboard;