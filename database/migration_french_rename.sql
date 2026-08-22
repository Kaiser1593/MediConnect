-- =====================================================
--  Migration : renommage complet du schéma vers le français
--  (Annexe B du dossier de projet). Préserve toutes les données
--  existantes — aucune table n'est vidée ou recréée.
--
--  Méthode : pour chaque table, on supprime d'abord toutes les
--  contraintes (clés étrangères, CHECK, index uniques) qui portent sur
--  les colonnes à renommer — MySQL refuse de renommer une colonne tant
--  qu'une contrainte la référence encore — puis on renomme, puis on
--  recrée les contraintes avec les nouveaux noms.
--
--  À exécuter UNE SEULE FOIS sur une base mediconnect existante
--  (celle avec les tables users/doctors/appointments...). Pour une
--  toute nouvelle installation, utiliser directement mediconnect.sql,
--  qui contient déjà le schéma français final.
-- =====================================================

USE mediconnect;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------
-- 1. SPECIALTIES -> SPECIALITES
-- ---------------------------------------------------
ALTER TABLE specialties DROP INDEX uq_specialties_name;
ALTER TABLE specialties DROP INDEX uq_specialties_slug;

RENAME TABLE specialties TO specialites;
ALTER TABLE specialites RENAME COLUMN name TO nom;
ALTER TABLE specialites RENAME COLUMN created_at TO date_creation;

ALTER TABLE specialites ADD CONSTRAINT uq_specialites_nom UNIQUE (nom);
ALTER TABLE specialites ADD CONSTRAINT uq_specialites_slug UNIQUE (slug);

-- ---------------------------------------------------
-- 2. USERS -> UTILISATEURS
-- ---------------------------------------------------
ALTER TABLE users DROP INDEX uq_users_email;
ALTER TABLE users DROP INDEX idx_users_role;

RENAME TABLE users TO utilisateurs;
ALTER TABLE utilisateurs RENAME COLUMN firstname TO prenom;
ALTER TABLE utilisateurs RENAME COLUMN lastname TO nom;
ALTER TABLE utilisateurs RENAME COLUMN password_hash TO mot_de_passe;
ALTER TABLE utilisateurs RENAME COLUMN phone TO telephone;
ALTER TABLE utilisateurs RENAME COLUMN created_at TO date_creation;
ALTER TABLE utilisateurs RENAME COLUMN updated_at TO date_modification;

-- role : la collation utf8mb4_unicode_ci est insensible à la casse, donc
-- un ENUM ne peut pas contenir à la fois 'patient' et 'PATIENT' (vus comme
-- doublons). On passe par un type texte intermédiaire le temps de migrer
-- les valeurs, puis on repasse en ENUM final.
ALTER TABLE utilisateurs MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'patient';
UPDATE utilisateurs SET role = CASE role
  WHEN 'patient' THEN 'PATIENT'
  WHEN 'doctor'  THEN 'MEDECIN'
  WHEN 'admin'   THEN 'ADMIN'
  ELSE role
END;
ALTER TABLE utilisateurs
  MODIFY COLUMN role ENUM('PATIENT','MEDECIN','ADMIN') NOT NULL DEFAULT 'PATIENT';

-- is_active (booléen) -> statut_compte (ACTIF/SUSPENDU), nécessaire pour
-- la suspension de compte par un administrateur.
ALTER TABLE utilisateurs
  ADD COLUMN statut_compte ENUM('ACTIF','SUSPENDU') NOT NULL DEFAULT 'ACTIF'
  AFTER telephone;
UPDATE utilisateurs SET statut_compte = IF(is_active = TRUE, 'ACTIF', 'SUSPENDU');
ALTER TABLE utilisateurs DROP COLUMN is_active;

ALTER TABLE utilisateurs ADD CONSTRAINT uq_utilisateurs_email UNIQUE (email);
ALTER TABLE utilisateurs ADD INDEX idx_utilisateurs_role (role);

-- ---------------------------------------------------
-- 3. PATIENTS (nom de table conservé, colonnes traduites)
-- ---------------------------------------------------
ALTER TABLE patients DROP FOREIGN KEY fk_patients_user;
ALTER TABLE patients DROP INDEX uq_patients_user;

ALTER TABLE patients RENAME COLUMN user_id TO utilisateur_id;
ALTER TABLE patients RENAME COLUMN birth_date TO date_naissance;
ALTER TABLE patients RENAME COLUMN address TO adresse;
ALTER TABLE patients RENAME COLUMN city TO ville;
ALTER TABLE patients RENAME COLUMN postal_code TO code_postal;
ALTER TABLE patients RENAME COLUMN created_at TO date_creation;

ALTER TABLE patients MODIFY COLUMN gender VARCHAR(10) NULL;
UPDATE patients SET gender = CASE gender
  WHEN 'female' THEN 'FEMININ'
  WHEN 'male'   THEN 'MASCULIN'
  WHEN 'other'  THEN 'AUTRE'
  ELSE gender
END;
ALTER TABLE patients CHANGE COLUMN gender genre ENUM('FEMININ','MASCULIN','AUTRE') NULL;

ALTER TABLE patients ADD CONSTRAINT uq_patients_utilisateur UNIQUE (utilisateur_id);
ALTER TABLE patients ADD CONSTRAINT fk_patients_utilisateur FOREIGN KEY (utilisateur_id)
  REFERENCES utilisateurs(id) ON DELETE CASCADE;

-- ---------------------------------------------------
-- 4. DOCTORS -> MEDECINS
-- ---------------------------------------------------
ALTER TABLE doctors DROP FOREIGN KEY fk_doctors_user;
ALTER TABLE doctors DROP FOREIGN KEY fk_doctors_specialty;
ALTER TABLE doctors DROP INDEX uq_doctors_user;
ALTER TABLE doctors DROP INDEX uq_doctors_license;
ALTER TABLE doctors DROP INDEX idx_doctors_specialty;
ALTER TABLE doctors DROP INDEX idx_doctors_city;
ALTER TABLE doctors DROP INDEX idx_doctors_approved;

RENAME TABLE doctors TO medecins;
ALTER TABLE medecins RENAME COLUMN user_id TO utilisateur_id;
ALTER TABLE medecins RENAME COLUMN specialty_id TO specialite_id;
ALTER TABLE medecins RENAME COLUMN license_number TO numero_rpps;
ALTER TABLE medecins RENAME COLUMN biography TO biographie;
ALTER TABLE medecins RENAME COLUMN address TO adresse;
ALTER TABLE medecins RENAME COLUMN city TO ville;
ALTER TABLE medecins RENAME COLUMN postal_code TO code_postal;
ALTER TABLE medecins RENAME COLUMN consultation_price TO prix_consultation;
ALTER TABLE medecins RENAME COLUMN experience_years TO annees_experience;
ALTER TABLE medecins RENAME COLUMN slot_duration TO duree_creneau;
ALTER TABLE medecins RENAME COLUMN is_approved TO est_valide;
ALTER TABLE medecins RENAME COLUMN created_at TO date_creation;

ALTER TABLE medecins ADD CONSTRAINT uq_medecins_utilisateur UNIQUE (utilisateur_id);
ALTER TABLE medecins ADD CONSTRAINT uq_medecins_rpps UNIQUE (numero_rpps);
ALTER TABLE medecins ADD CONSTRAINT fk_medecins_utilisateur FOREIGN KEY (utilisateur_id)
  REFERENCES utilisateurs(id) ON DELETE CASCADE;
ALTER TABLE medecins ADD CONSTRAINT fk_medecins_specialite FOREIGN KEY (specialite_id)
  REFERENCES specialites(id) ON DELETE SET NULL;
ALTER TABLE medecins ADD INDEX idx_medecins_specialite (specialite_id);
ALTER TABLE medecins ADD INDEX idx_medecins_ville (ville);
ALTER TABLE medecins ADD INDEX idx_medecins_valide (est_valide);

-- ---------------------------------------------------
-- 5. DOCTOR_AVAILABILITIES -> DISPONIBILITES
-- ---------------------------------------------------
ALTER TABLE doctor_availabilities DROP FOREIGN KEY fk_availabilities_doctor;
ALTER TABLE doctor_availabilities DROP CHECK chk_availabilities_weekday;
ALTER TABLE doctor_availabilities DROP CHECK chk_availabilities_hours;
ALTER TABLE doctor_availabilities DROP INDEX idx_availabilities_doctor_day;

RENAME TABLE doctor_availabilities TO disponibilites;
ALTER TABLE disponibilites RENAME COLUMN doctor_id TO medecin_id;
ALTER TABLE disponibilites RENAME COLUMN weekday TO jour_semaine;
ALTER TABLE disponibilites RENAME COLUMN start_time TO heure_debut;
ALTER TABLE disponibilites RENAME COLUMN end_time TO heure_fin;

ALTER TABLE disponibilites ADD CONSTRAINT fk_disponibilites_medecin FOREIGN KEY (medecin_id)
  REFERENCES medecins(id) ON DELETE CASCADE;
ALTER TABLE disponibilites ADD CONSTRAINT chk_disponibilites_jour CHECK (jour_semaine BETWEEN 1 AND 7);
ALTER TABLE disponibilites ADD CONSTRAINT chk_disponibilites_heures CHECK (heure_fin > heure_debut);
ALTER TABLE disponibilites ADD INDEX idx_disponibilites_medecin_jour (medecin_id, jour_semaine);

-- ---------------------------------------------------
-- 6. APPOINTMENTS -> RENDEZ_VOUS
-- ---------------------------------------------------
ALTER TABLE appointments DROP FOREIGN KEY fk_appointments_patient;
ALTER TABLE appointments DROP FOREIGN KEY fk_appointments_doctor;
ALTER TABLE appointments DROP INDEX uq_appointments_slot;
ALTER TABLE appointments DROP INDEX idx_appointments_patient;
ALTER TABLE appointments DROP INDEX idx_appointments_doctor;
ALTER TABLE appointments DROP INDEX idx_appointments_status;

RENAME TABLE appointments TO rendez_vous;
ALTER TABLE rendez_vous RENAME COLUMN doctor_id TO medecin_id;
ALTER TABLE rendez_vous RENAME COLUMN scheduled_on TO date_rdv;
ALTER TABLE rendez_vous RENAME COLUMN start_time TO heure_debut;
ALTER TABLE rendez_vous RENAME COLUMN end_time TO heure_fin;
ALTER TABLE rendez_vous RENAME COLUMN reason TO motif;
ALTER TABLE rendez_vous RENAME COLUMN doctor_notes TO notes_medecin;
ALTER TABLE rendez_vous RENAME COLUMN created_at TO date_creation;
ALTER TABLE rendez_vous RENAME COLUMN updated_at TO date_modification;

ALTER TABLE rendez_vous MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
UPDATE rendez_vous SET status = CASE status
  WHEN 'pending'   THEN 'EN_ATTENTE'
  WHEN 'confirmed' THEN 'CONFIRME'
  WHEN 'cancelled' THEN 'ANNULE'
  WHEN 'completed' THEN 'TERMINE'
  ELSE status
END;
ALTER TABLE rendez_vous
  CHANGE COLUMN status statut ENUM('EN_ATTENTE','CONFIRME','ANNULE','TERMINE')
  NOT NULL DEFAULT 'EN_ATTENTE';

ALTER TABLE rendez_vous ADD CONSTRAINT fk_rendez_vous_patient FOREIGN KEY (patient_id)
  REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE rendez_vous ADD CONSTRAINT fk_rendez_vous_medecin FOREIGN KEY (medecin_id)
  REFERENCES medecins(id) ON DELETE CASCADE;
ALTER TABLE rendez_vous ADD CONSTRAINT uq_rendez_vous_creneau UNIQUE (medecin_id, date_rdv, heure_debut);
ALTER TABLE rendez_vous ADD INDEX idx_rendez_vous_patient (patient_id, date_rdv);
ALTER TABLE rendez_vous ADD INDEX idx_rendez_vous_medecin (medecin_id, date_rdv);
ALTER TABLE rendez_vous ADD INDEX idx_rendez_vous_statut (statut);

-- ---------------------------------------------------
-- 7. REVIEWS -> AVIS
-- ---------------------------------------------------
ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_appointment;
ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_patient;
ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_doctor;
ALTER TABLE reviews DROP CHECK chk_reviews_rating;
ALTER TABLE reviews DROP INDEX uq_reviews_appointment;
ALTER TABLE reviews DROP INDEX idx_reviews_doctor;

RENAME TABLE reviews TO avis;
ALTER TABLE avis RENAME COLUMN appointment_id TO rendez_vous_id;
ALTER TABLE avis RENAME COLUMN doctor_id TO medecin_id;
ALTER TABLE avis RENAME COLUMN rating TO note;
ALTER TABLE avis RENAME COLUMN comment TO commentaire;
ALTER TABLE avis RENAME COLUMN created_at TO date_creation;

ALTER TABLE avis ADD CONSTRAINT uq_avis_rendez_vous UNIQUE (rendez_vous_id);
ALTER TABLE avis ADD CONSTRAINT fk_avis_rendez_vous FOREIGN KEY (rendez_vous_id)
  REFERENCES rendez_vous(id) ON DELETE CASCADE;
ALTER TABLE avis ADD CONSTRAINT fk_avis_patient FOREIGN KEY (patient_id)
  REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE avis ADD CONSTRAINT fk_avis_medecin FOREIGN KEY (medecin_id)
  REFERENCES medecins(id) ON DELETE CASCADE;
ALTER TABLE avis ADD CONSTRAINT chk_avis_note CHECK (note BETWEEN 1 AND 5);
ALTER TABLE avis ADD INDEX idx_avis_medecin (medecin_id);

-- ---------------------------------------------------
-- 8. NOTIFICATIONS (nom conservé, colonnes traduites,
--    + colonne rendez_vous_id, absente jusqu'ici)
-- ---------------------------------------------------
ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_user;
ALTER TABLE notifications DROP INDEX idx_notifications_user;

ALTER TABLE notifications RENAME COLUMN user_id TO utilisateur_id;
ALTER TABLE notifications RENAME COLUMN title TO titre;
ALTER TABLE notifications RENAME COLUMN is_read TO lue;
ALTER TABLE notifications RENAME COLUMN created_at TO date_envoi;
ALTER TABLE notifications ADD COLUMN rendez_vous_id INT UNSIGNED NULL AFTER utilisateur_id;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_utilisateur FOREIGN KEY (utilisateur_id)
  REFERENCES utilisateurs(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_rendez_vous FOREIGN KEY (rendez_vous_id)
  REFERENCES rendez_vous(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD INDEX idx_notifications_utilisateur (utilisateur_id, lue);

-- ---------------------------------------------------
-- 9. SECURITY_LOGS -> JOURNAUX_SECURITE (+ colonne user_agent)
-- ---------------------------------------------------
ALTER TABLE security_logs DROP FOREIGN KEY fk_security_logs_user;
ALTER TABLE security_logs DROP INDEX idx_security_logs_type;
ALTER TABLE security_logs DROP INDEX idx_security_logs_user;

RENAME TABLE security_logs TO journaux_securite;
ALTER TABLE journaux_securite RENAME COLUMN user_id TO utilisateur_id;
ALTER TABLE journaux_securite RENAME COLUMN event_type TO type_evenement;
ALTER TABLE journaux_securite RENAME COLUMN message TO description;
ALTER TABLE journaux_securite RENAME COLUMN ip_address TO adresse_ip;
ALTER TABLE journaux_securite RENAME COLUMN created_at TO date_evenement;
ALTER TABLE journaux_securite ADD COLUMN user_agent VARCHAR(255) NULL AFTER adresse_ip;

ALTER TABLE journaux_securite ADD CONSTRAINT fk_journaux_securite_utilisateur FOREIGN KEY (utilisateur_id)
  REFERENCES utilisateurs(id) ON DELETE SET NULL;
ALTER TABLE journaux_securite ADD INDEX idx_journaux_securite_type (type_evenement, date_evenement);
ALTER TABLE journaux_securite ADD INDEX idx_journaux_securite_utilisateur (utilisateur_id);

-- Traduit les types d'événements déjà journalisés (anglais -> français),
-- pour que l'historique existant reste lisible dans la nouvelle base.
UPDATE journaux_securite SET type_evenement = CASE type_evenement
  WHEN 'LOGIN_SUCCESS'             THEN 'CONNEXION_REUSSIE'
  WHEN 'LOGIN_FAILED'              THEN 'CONNEXION_ECHOUEE'
  WHEN 'REGISTER'                  THEN 'INSCRIPTION'
  WHEN 'PASSWORD_CHANGED'          THEN 'MOT_DE_PASSE_MODIFIE'
  WHEN 'PASSWORD_RESET_REQUESTED'  THEN 'REINITIALISATION_DEMANDEE'
  WHEN 'PASSWORD_RESET'            THEN 'MOT_DE_PASSE_REINITIALISE'
  WHEN 'ACCESS_DENIED'             THEN 'ACCES_REFUSE'
  WHEN 'DOCTOR_APPROVED'           THEN 'MEDECIN_VALIDE'
  WHEN 'USER_STATUS_CHANGED'       THEN 'SUSPENSION_COMPTE'
  ELSE type_evenement
END;

-- ---------------------------------------------------
-- 10. PASSWORD_RESETS -> REINITIALISATIONS_MOT_DE_PASSE
-- ---------------------------------------------------
ALTER TABLE password_resets DROP FOREIGN KEY fk_password_resets_user;
ALTER TABLE password_resets DROP INDEX idx_password_resets_token;
ALTER TABLE password_resets DROP INDEX idx_password_resets_user;

RENAME TABLE password_resets TO reinitialisations_mot_de_passe;
ALTER TABLE reinitialisations_mot_de_passe RENAME COLUMN user_id TO utilisateur_id;
ALTER TABLE reinitialisations_mot_de_passe RENAME COLUMN token_hash TO jeton_hache;
ALTER TABLE reinitialisations_mot_de_passe RENAME COLUMN expires_at TO expire_le;
ALTER TABLE reinitialisations_mot_de_passe RENAME COLUMN used_at TO utilise_le;
ALTER TABLE reinitialisations_mot_de_passe RENAME COLUMN created_at TO date_creation;

ALTER TABLE reinitialisations_mot_de_passe
  ADD CONSTRAINT fk_reinitialisations_utilisateur FOREIGN KEY (utilisateur_id)
  REFERENCES utilisateurs(id) ON DELETE CASCADE;
ALTER TABLE reinitialisations_mot_de_passe ADD INDEX idx_reinitialisations_jeton (jeton_hache);
ALTER TABLE reinitialisations_mot_de_passe ADD INDEX idx_reinitialisations_utilisateur (utilisateur_id);

-- ---------------------------------------------------
-- 11. VUE : v_doctors_public -> v_medecins_public
-- ---------------------------------------------------
DROP VIEW IF EXISTS v_doctors_public;

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

SET FOREIGN_KEY_CHECKS = 1;
