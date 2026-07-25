import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="section-label">Votre santé, plus simplement</p>

          <h1>
            Prenez rendez-vous avec un professionnel de santé
          </h1>

          <p className="hero-description">
            Recherchez un médecin, consultez ses disponibilités et réservez
            votre rendez-vous en seulement quelques clics.
          </p>

          <div className="hero-actions">
            <Link to="/inscription" className="primary-button">
              Prendre rendez-vous
            </Link>

            <a href="#fonctionnement" className="secondary-button">
              Découvrir MediConnect
            </a>
          </div>

          <div className="hero-statistics">
            <div>
              <strong>24 h/24</strong>
              <span>Accessible en ligne</span>
            </div>

            <div>
              <strong>Simple</strong>
              <span>Réservation rapide</span>
            </div>

            <div>
              <strong>Sécurisé</strong>
              <span>Données protégées</span>
            </div>
          </div>
        </div>

        <div className="appointment-card">
          <div className="doctor-header">
            <div className="doctor-avatar">SM</div>

            <div>
              <h3>Dr Sarah Martin</h3>
              <p>Médecin généraliste</p>
            </div>
          </div>

          <div className="appointment-details">
            <div>
              <span>Date</span>
              <strong>12 août 2026</strong>
            </div>

            <div>
              <span>Horaire</span>
              <strong>14 h 30</strong>
            </div>

            <div>
              <span>Lieu</span>
              <strong>Cabinet médical</strong>
            </div>
          </div>

          <button type="button" className="confirmed-button">
            Rendez-vous confirmé
          </button>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="section-heading">
          <p className="section-label">Nos services</p>
          <h2>Une plateforme adaptée à chaque utilisateur</h2>
        </div>

        <div className="cards-grid">
          <article className="service-card">
            <div className="card-icon">P</div>
            <h3>Espace patient</h3>
            <p>
              Recherchez un médecin et gérez facilement vos rendez-vous.
            </p>
          </article>

          <article className="service-card">
            <div className="card-icon">M</div>
            <h3>Espace médecin</h3>
            <p>
              Gérez vos disponibilités et consultez les demandes des patients.
            </p>
          </article>

          <article className="service-card">
            <div className="card-icon">A</div>
            <h3>Administration</h3>
            <p>
              Supervisez les utilisateurs et l’activité de la plateforme.
            </p>
          </article>
        </div>
      </section>

      <section id="fonctionnement" className="steps-section">
        <div className="section-heading">
          <p className="section-label">Fonctionnement</p>
          <h2>Un rendez-vous en trois étapes</h2>
        </div>

        <div className="cards-grid">
          <article className="step-card">
            <span>01</span>
            <h3>Rechercher</h3>
            <p>Trouvez un médecin selon sa spécialité.</p>
          </article>

          <article className="step-card">
            <span>02</span>
            <h3>Choisir</h3>
            <p>Sélectionnez une date et un créneau disponible.</p>
          </article>

          <article className="step-card">
            <span>03</span>
            <h3>Confirmer</h3>
            <p>Validez votre demande depuis votre espace personnel.</p>
          </article>
        </div>
      </section>
    </>
  );
}

export default Home;