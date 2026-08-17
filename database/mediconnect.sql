-- =====================================================
--  MediConnect - Schéma de la base de données
--  SGBD : MySQL 8.0+
--  Encodage : utf8mb4 (accents et emojis pris en charge)
-- =====================================================

DROP DATABASE IF EXISTS mediconnect;

CREATE DATABASE mediconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mediconnect;


-- =====================================================
--  1. SPECIALTIES : les spécialités médicales
-- =====================================================
CREATE TABLE specialties (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  description  TEXT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_specialties_name UNIQUE (name),
  CONSTRAINT uq_specialties_slug UNIQUE (slug)
) ENGINE = InnoDB;


-- =====================================================
--  2. USERS : compte de connexion commun à tous les rôles
--     Le mot de passe est stocké HACHÉ (bcrypt), jamais en clair.
-- =====================================================
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstname      VARCHAR(80)  NOT NULL,
  lastname       VARCHAR(80)  NOT NULL,
  email          VARCHAR(180) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  phone          VARCHAR(20)  NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_role (role)
) ENGINE = InnoDB;


-- =====================================================
--  3. PATIENTS : informations propres au patient
--     Relation 1-1 avec users (ON DELETE CASCADE)
-- =====================================================
CREATE TABLE patients (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  birth_date   DATE         NULL,
  gender       ENUM('female', 'male', 'other') NULL,
  address      VARCHAR(255) NULL,
  city         VARCHAR(100) NULL,
  postal_code  VARCHAR(10)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_patients_user UNIQUE (user_id),
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- =====================================================
--  4. DOCTORS : informations propres au médecin
--     is_approved = validation par l'administrateur
--     (ton dashboard admin affiche déjà un statut "En attente")
-- =====================================================
CREATE TABLE doctors (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            INT UNSIGNED NOT NULL,
  specialty_id       INT UNSIGNED NULL,
  license_number     VARCHAR(50)  NULL,          -- numéro RPPS
  biography          TEXT         NULL,
  address            VARCHAR(255) NULL,
  city               VARCHAR(100) NULL,
  postal_code        VARCHAR(10)  NULL,
  consultation_price DECIMAL(6,2) NULL,          -- ex : 30.00
  experience_years   TINYINT UNSIGNED NULL,
  slot_duration      TINYINT UNSIGNED NOT NULL DEFAULT 30,  -- minutes
  is_approved        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_doctors_user    UNIQUE (user_id),
  CONSTRAINT uq_doctors_license UNIQUE (license_number),
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctors_specialty FOREIGN KEY (specialty_id)
    REFERENCES specialties(id) ON DELETE SET NULL,

  INDEX idx_doctors_specialty (specialty_id),
  INDEX idx_doctors_city (city),
  INDEX idx_doctors_approved (is_approved)
) ENGINE = InnoDB;


-- =====================================================
--  5. DOCTOR_AVAILABILITIES : horaires hebdomadaires
--     weekday : 1 = lundi ... 7 = dimanche (norme ISO-8601)
--     C'est cette table qui génère les créneaux de réservation.
-- =====================================================
CREATE TABLE doctor_availabilities (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id   INT UNSIGNED NOT NULL,
  weekday     TINYINT UNSIGNED NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,

  CONSTRAINT fk_availabilities_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT chk_availabilities_weekday CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT chk_availabilities_hours   CHECK (end_time > start_time),

  INDEX idx_availabilities_doctor_day (doctor_id, weekday)
) ENGINE = InnoDB;


-- =====================================================
--  6. APPOINTMENTS : les rendez-vous
--     La contrainte UNIQUE empêche deux patients de réserver
--     le même créneau chez le même médecin (double réservation).
-- =====================================================
CREATE TABLE appointments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT UNSIGNED NOT NULL,
  doctor_id    INT UNSIGNED NOT NULL,
  scheduled_on DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  status       ENUM('pending', 'confirmed', 'cancelled', 'completed')
               NOT NULL DEFAULT 'pending',
  reason       VARCHAR(255) NULL,   -- motif saisi par le patient
  doctor_notes TEXT NULL,           -- compte rendu, visible du médecin seul
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE CASCADE,

  CONSTRAINT uq_appointments_slot UNIQUE (doctor_id, scheduled_on, start_time),

  INDEX idx_appointments_patient (patient_id, scheduled_on),
  INDEX idx_appointments_doctor  (doctor_id, scheduled_on),
  INDEX idx_appointments_status  (status)
) ENGINE = InnoDB;


-- =====================================================
--  7. REVIEWS : avis laissés après une consultation
--     1 avis maximum par rendez-vous.
-- =====================================================
CREATE TABLE reviews (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT UNSIGNED NOT NULL,
  patient_id     INT UNSIGNED NOT NULL,
  doctor_id      INT UNSIGNED NOT NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  comment        TEXT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_reviews_appointment UNIQUE (appointment_id),
  CONSTRAINT fk_reviews_appointment FOREIGN KEY (appointment_id)
    REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),

  INDEX idx_reviews_doctor (doctor_id)
) ENGINE = InnoDB;


-- =====================================================
--  8. NOTIFICATIONS (pour ton notificationService.js)
-- =====================================================
CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(50)  NOT NULL,   -- ex : 'appointment_confirmed'
  title      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_notifications_user (user_id, is_read)
) ENGINE = InnoDB;


-- =====================================================
--  DONNÉES DE BASE : les spécialités
-- =====================================================
INSERT INTO specialties (name, slug, description) VALUES
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
--  Simplifie la page "Rechercher un médecin".
-- =====================================================
CREATE OR REPLACE VIEW v_doctors_public AS
SELECT
  d.id                AS doctor_id,
  u.firstname,
  u.lastname,
  CONCAT('Dr ', u.firstname, ' ', u.lastname) AS full_name,
  s.name              AS specialty,
  d.city,
  d.postal_code,
  d.consultation_price,
  d.experience_years,
  d.slot_duration,
  ROUND(AVG(r.rating), 1) AS average_rating,
  COUNT(r.id)             AS review_count
FROM doctors d
JOIN users u        ON u.id = d.user_id
LEFT JOIN specialties s ON s.id = d.specialty_id
LEFT JOIN reviews r     ON r.doctor_id = d.id
WHERE d.is_approved = TRUE
  AND u.is_active   = TRUE
GROUP BY d.id, u.firstname, u.lastname, s.name, d.city,
         d.postal_code, d.consultation_price, d.experience_years, d.slot_duration;