-- =====================================================
--  MediConnect - Schéma de la base de données
--  SGBD : MySQL 8.0+
--  Encodage : utf8mb4 (accents et emojis pris en charge)
--  Noms de tables et de colonnes en français, conformes à l'Annexe B
--  du dossier de projet. Voir database/CHANGELOG.md pour le détail des
--  écarts assumés entre l'Annexe B et ce schéma (évolutions techniques
--  post-conception).
-- =====================================================

DROP DATABASE IF EXISTS mediconnect;

CREATE DATABASE mediconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mediconnect;


-- =====================================================
--  1. SPECIALITES : les spécialités médicales
-- =====================================================
CREATE TABLE specialites (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom          VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  description  TEXT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_specialites_nom UNIQUE (nom),
  CONSTRAINT uq_specialites_slug UNIQUE (slug)
) ENGINE = InnoDB;


-- =====================================================
--  2. UTILISATEURS : compte de connexion commun à tous les rôles
--     Le mot de passe est stocké HACHÉ (bcrypt), jamais en clair.
--     statut_compte permet la suspension d'un compte par un administrateur.
-- =====================================================
CREATE TABLE utilisateurs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(80)  NOT NULL,
  prenom         VARCHAR(80)  NOT NULL,
  email          VARCHAR(180) NOT NULL,
  mot_de_passe   VARCHAR(255) NOT NULL,
  role           ENUM('PATIENT', 'MEDECIN', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
  telephone      VARCHAR(20)  NULL,
  statut_compte  ENUM('ACTIF', 'SUSPENDU') NOT NULL DEFAULT 'ACTIF',
  date_creation  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_utilisateurs_email UNIQUE (email),
  INDEX idx_utilisateurs_role (role)
) ENGINE = InnoDB;


-- =====================================================
--  3. PATIENTS : informations propres au patient
--     Relation 1-1 avec utilisateurs (ON DELETE CASCADE)
-- =====================================================
CREATE TABLE patients (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  date_naissance DATE         NULL,
  genre          ENUM('FEMININ', 'MASCULIN', 'AUTRE') NULL,
  adresse        VARCHAR(255) NULL,
  ville          VARCHAR(100) NULL,
  code_postal    VARCHAR(10)  NULL,
  date_creation  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_patients_utilisateur UNIQUE (utilisateur_id),
  CONSTRAINT fk_patients_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- =====================================================
--  4. MEDECINS : informations propres au médecin
--     est_valide = validation par l'administrateur avant apparition
--     dans les résultats de recherche publics.
-- =====================================================
CREATE TABLE medecins (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id     INT UNSIGNED NOT NULL,
  specialite_id      INT UNSIGNED NULL,
  numero_rpps        VARCHAR(50)  NULL,
  biographie         TEXT         NULL,
  adresse            VARCHAR(255) NULL,
  ville              VARCHAR(100) NULL,
  code_postal        VARCHAR(10)  NULL,
  prix_consultation  DECIMAL(6,2) NULL,          -- ex : 30.00
  annees_experience  TINYINT UNSIGNED NULL,
  duree_creneau      TINYINT UNSIGNED NOT NULL DEFAULT 30,  -- minutes
  est_valide         BOOLEAN      NOT NULL DEFAULT FALSE,
  date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_medecins_utilisateur UNIQUE (utilisateur_id),
  CONSTRAINT uq_medecins_rpps UNIQUE (numero_rpps),
  CONSTRAINT fk_medecins_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_medecins_specialite FOREIGN KEY (specialite_id)
    REFERENCES specialites(id) ON DELETE SET NULL,

  INDEX idx_medecins_specialite (specialite_id),
  INDEX idx_medecins_ville (ville),
  INDEX idx_medecins_valide (est_valide)
) ENGINE = InnoDB;


-- =====================================================
--  5. DISPONIBILITES : horaires hebdomadaires récurrents
--     jour_semaine : 1 = lundi ... 7 = dimanche (norme ISO-8601)
--     Modèle récurrent (par jour de semaine) plutôt que des créneaux
--     datés un par un : voir CHANGELOG.md pour la justification.
--     C'est cette table qui génère les créneaux de réservation.
-- =====================================================
CREATE TABLE disponibilites (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medecin_id    INT UNSIGNED NOT NULL,
  jour_semaine  TINYINT UNSIGNED NOT NULL,
  heure_debut   TIME NOT NULL,
  heure_fin     TIME NOT NULL,

  CONSTRAINT fk_disponibilites_medecin FOREIGN KEY (medecin_id)
    REFERENCES medecins(id) ON DELETE CASCADE,
  CONSTRAINT chk_disponibilites_jour CHECK (jour_semaine BETWEEN 1 AND 7),
  CONSTRAINT chk_disponibilites_heures CHECK (heure_fin > heure_debut),

  INDEX idx_disponibilites_medecin_jour (medecin_id, jour_semaine)
) ENGINE = InnoDB;


-- =====================================================
--  6. RENDEZ_VOUS : les rendez-vous
--     La contrainte UNIQUE empêche deux patients de réserver
--     le même créneau chez le même médecin (double réservation),
--     garantie par le SGBD plutôt que par la seule logique applicative.
-- =====================================================
CREATE TABLE rendez_vous (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT UNSIGNED NOT NULL,
  medecin_id     INT UNSIGNED NOT NULL,
  date_rdv       DATE NOT NULL,
  heure_debut    TIME NOT NULL,
  heure_fin      TIME NOT NULL,
  statut         ENUM('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE')
                 NOT NULL DEFAULT 'EN_ATTENTE',
  motif          VARCHAR(255) NULL,   -- saisi par le patient
  notes_medecin  TEXT NULL,           -- compte rendu, visible du médecin seul
  date_creation  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rendez_vous_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_rendez_vous_medecin FOREIGN KEY (medecin_id)
    REFERENCES medecins(id) ON DELETE CASCADE,

  CONSTRAINT uq_rendez_vous_creneau UNIQUE (medecin_id, date_rdv, heure_debut),

  INDEX idx_rendez_vous_patient (patient_id, date_rdv),
  INDEX idx_rendez_vous_medecin (medecin_id, date_rdv),
  INDEX idx_rendez_vous_statut  (statut)
) ENGINE = InnoDB;


-- =====================================================
--  7. AVIS : avis laissés après une consultation
--     1 avis maximum par rendez-vous.
-- =====================================================
CREATE TABLE avis (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rendez_vous_id INT UNSIGNED NOT NULL,
  patient_id     INT UNSIGNED NOT NULL,
  medecin_id     INT UNSIGNED NOT NULL,
  note           TINYINT UNSIGNED NOT NULL,
  commentaire    TEXT NULL,
  date_creation  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_avis_rendez_vous UNIQUE (rendez_vous_id),
  CONSTRAINT fk_avis_rendez_vous FOREIGN KEY (rendez_vous_id)
    REFERENCES rendez_vous(id) ON DELETE CASCADE,
  CONSTRAINT fk_avis_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_avis_medecin FOREIGN KEY (medecin_id)
    REFERENCES medecins(id) ON DELETE CASCADE,
  CONSTRAINT chk_avis_note CHECK (note BETWEEN 1 AND 5),

  INDEX idx_avis_medecin (medecin_id)
) ENGINE = InnoDB;


-- =====================================================
--  8. NOTIFICATIONS
--     rendez_vous_id est nullable : une notification n'est pas toujours
--     liée à un rendez-vous précis ; ON DELETE SET NULL préserve
--     l'historique de la notification même si le rendez-vous est purgé.
-- =====================================================
CREATE TABLE notifications (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  rendez_vous_id INT UNSIGNED NULL,
  type           VARCHAR(50)  NOT NULL,   -- ex : 'appointment_confirmed'
  titre          VARCHAR(150) NOT NULL,
  message        TEXT NOT NULL,
  lue            BOOLEAN NOT NULL DEFAULT FALSE,
  date_envoi     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_rendez_vous FOREIGN KEY (rendez_vous_id)
    REFERENCES rendez_vous(id) ON DELETE SET NULL,

  INDEX idx_notifications_utilisateur (utilisateur_id, lue)
) ENGINE = InnoDB;


-- =====================================================
--  9. JOURNAUX_SECURITE : journal des événements de sécurité
--     utilisateur_id est nullable : une tentative de connexion sur un
--     e-mail inexistant n'a pas d'utilisateur associé.
--     Ne journalise jamais de mot de passe ni de token.
-- =====================================================
CREATE TABLE journaux_securite (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NULL,
  type_evenement VARCHAR(50) NOT NULL,
  description    VARCHAR(255) NOT NULL,
  adresse_ip     VARCHAR(45) NULL,
  user_agent     VARCHAR(255) NULL,
  date_evenement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_journaux_securite_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id) ON DELETE SET NULL,

  INDEX idx_journaux_securite_type (type_evenement, date_evenement),
  INDEX idx_journaux_securite_utilisateur (utilisateur_id)
) ENGINE = InnoDB;


-- =====================================================
--  10. REINITIALISATIONS_MOT_DE_PASSE : jetons de réinitialisation
--     Seul le hachage du jeton est stocké (comme un mot de passe) : le
--     jeton en clair n'existe que dans le lien envoyé par e-mail, jamais
--     en base. À usage unique (utilise_le) et à durée de vie limitée.
-- =====================================================
CREATE TABLE reinitialisations_mot_de_passe (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  jeton_hache    CHAR(64)     NOT NULL,  -- SHA-256 du jeton, en hexadécimal
  expire_le      TIMESTAMP    NOT NULL,
  utilise_le     TIMESTAMP    NULL,
  date_creation  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reinitialisations_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id) ON DELETE CASCADE,

  INDEX idx_reinitialisations_jeton (jeton_hache),
  INDEX idx_reinitialisations_utilisateur (utilisateur_id)
) ENGINE = InnoDB;


-- =====================================================
--  DONNÉES DE BASE : les spécialités
-- =====================================================
INSERT INTO specialites (nom, slug, description) VALUES
  ('Médecine générale', 'medecine-generale', 'Suivi médical courant et prévention'),
  ('Dermatologie',      'dermatologie',      'Maladies de la peau, des cheveux et des ongles'),
  ('Ophtalmologie',     'ophtalmologie',     'Santé et correction de la vision'),
  ('Cardiologie',       'cardiologie',       'Maladies du cœur et des vaisseaux'),
  ('Pédiatrie',         'pediatrie',         'Santé de l''enfant et de l''adolescent'),
  ('Gynécologie',       'gynecologie',       'Santé de la femme'),
  ('Psychiatrie',       'psychiatrie',       'Santé mentale et troubles psychiques'),
  ('Radiologie',        'radiologie',        'Imagerie médicale et diagnostic'),
  ('Rhumatologie',      'rhumatologie',      'Articulations, os et muscles'),
  ('ORL',               'orl',               'Oreilles, nez et gorge');


-- =====================================================
--  VUE PRATIQUE : médecins avec leurs infos utilisateur
--  Simplifie la page "Rechercher un médecin". Les alias de colonnes
--  restent en anglais côté vue (doctor_id, firstname...) : c'est la
--  frontière de traduction utilisée par backend/models/doctorModel.js,
--  qui alimente un frontend qui n'a pas été retouché dans ce renommage.
-- =====================================================
CREATE OR REPLACE VIEW v_medecins_public AS
SELECT
  m.id                AS doctor_id,
  u.prenom            AS firstname,
  u.nom               AS lastname,
  CONCAT('Dr ', u.prenom, ' ', u.nom) AS full_name,
  s.nom               AS specialty,
  m.ville             AS city,
  m.code_postal       AS postal_code,
  m.prix_consultation AS consultation_price,
  m.annees_experience AS experience_years,
  m.duree_creneau     AS slot_duration,
  ROUND(AVG(a.note), 1) AS average_rating,
  COUNT(a.id)           AS review_count
FROM medecins m
JOIN utilisateurs u        ON u.id = m.utilisateur_id
LEFT JOIN specialites s ON s.id = m.specialite_id
LEFT JOIN avis a        ON a.medecin_id = m.id
WHERE m.est_valide    = TRUE
  AND u.statut_compte = 'ACTIF'
GROUP BY m.id, u.prenom, u.nom, s.nom, m.ville,
         m.code_postal, m.prix_consultation, m.annees_experience, m.duree_creneau;
