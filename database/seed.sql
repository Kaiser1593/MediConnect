-- =====================================================
--  MediConnect - Jeu d'essai
--  À charger APRÈS database/mediconnect.sql, sur une base vide :
--
--    mysql -u root -p mediconnect_test < database/mediconnect.sql
--    mysql -u root -p mediconnect_test < database/seed.sql
--
--  Comptes créés (mot de passe identique pour tous les comptes d'un même
--  rôle, uniquement pour ce jeu d'essai — jamais en production) :
--    Administrateur : admin.test@integration-test.local   / AdminTest123!
--    Médecins       : <prenom>.<nom>@integration-test.local / MedecinTest123!
--    Patients       : <prenom>.<nom>@integration-test.local / PatientTest123!
--
--  Les hachages bcrypt ci-dessous (coût 12, identique à
--  backend/utils/hashPassword.js) correspondent exactement aux mots de
--  passe en clair listés ci-dessus : ne pas les régénérer sans mettre à
--  jour ce commentaire.
-- =====================================================

USE mediconnect;


-- =====================================================
--  ADMINISTRATEUR
-- =====================================================
INSERT INTO utilisateurs (id, prenom, nom, email, mot_de_passe, role, consentement_rgpd_le) VALUES
  (1, 'Admin', 'Test', 'admin.test@integration-test.local',
   '$2b$12$8psaQDL05aqjTTWYxGKSvexZlLUpi.GuvbR9NdqkrjYVYLEwc3Yma', 'ADMIN', NOW());


-- =====================================================
--  PATIENTS (3)
-- =====================================================
INSERT INTO utilisateurs (id, prenom, nom, email, mot_de_passe, role, telephone, consentement_rgpd_le) VALUES
  (2, 'Nadia',  'Ferreira', 'nadia.ferreira@integration-test.local',
   '$2b$12$fSKbBd.vE5Z2l79y/dW3tOTFzKeQFQi/yW7X81DdbbizbbmauGz8q', 'PATIENT', '0601020304', NOW()),
  (3, 'Hugo',   'Lemoine',  'hugo.lemoine@integration-test.local',
   '$2b$12$fSKbBd.vE5Z2l79y/dW3tOTFzKeQFQi/yW7X81DdbbizbbmauGz8q', 'PATIENT', '0601020305', NOW()),
  (4, 'Chloe',  'Girard',   'chloe.girard@integration-test.local',
   '$2b$12$fSKbBd.vE5Z2l79y/dW3tOTFzKeQFQi/yW7X81DdbbizbbmauGz8q', 'PATIENT', '0601020306', NOW());

INSERT INTO patients (id, utilisateur_id, date_naissance, genre, adresse, ville, code_postal) VALUES
  (1, 2, '1990-04-12', 'FEMININ',  '12 rue des Lilas',    'Paris',    '75011'),
  (2, 3, '1985-09-03', 'MASCULIN', '4 avenue Foch',       'Lyon',     '69006'),
  (3, 4, '1998-01-22', 'FEMININ',  '9 boulevard de la Mer','Marseille','13008');


-- =====================================================
--  MEDECINS (4), un par spécialité, tous validés
--  (specialite_id : 1 = Médecine générale, 2 = Dermatologie,
--   4 = Cardiologie, 5 = Pédiatrie, cf. database/mediconnect.sql)
-- =====================================================
INSERT INTO utilisateurs (id, prenom, nom, email, mot_de_passe, role, telephone, consentement_rgpd_le) VALUES
  (5, 'Amandine', 'Corre',    'amandine.corre@integration-test.local',
   '$2b$12$pA4j/1RkdFED98275Y2DDuTIhjeJq/OW3NN7/wYTPRe87k583BLY6', 'MEDECIN', '0611020304', NOW()),
  (6, 'Karim',    'Belkacem', 'karim.belkacem@integration-test.local',
   '$2b$12$pA4j/1RkdFED98275Y2DDuTIhjeJq/OW3NN7/wYTPRe87k583BLY6', 'MEDECIN', '0611020305', NOW()),
  (7, 'Laura',    'Chevalier','laura.chevalier@integration-test.local',
   '$2b$12$pA4j/1RkdFED98275Y2DDuTIhjeJq/OW3NN7/wYTPRe87k583BLY6', 'MEDECIN', '0611020306', NOW()),
  (8, 'Yohann',   'Perret',   'yohann.perret@integration-test.local',
   '$2b$12$pA4j/1RkdFED98275Y2DDuTIhjeJq/OW3NN7/wYTPRe87k583BLY6', 'MEDECIN', '0611020307', NOW());

INSERT INTO medecins (id, utilisateur_id, specialite_id, numero_rpps, biographie, adresse, ville, code_postal, prix_consultation, annees_experience, duree_creneau, est_valide) VALUES
  (1, 5, 1, '10000000001', 'Médecine générale, suivi et prévention.',       '3 rue de la Santé',   'Paris',     '75013', 25.00,  8, 30, TRUE),
  (2, 6, 2, '10000000002', 'Dermatologie, consultations et dépistage.',     '18 rue de Lyon',      'Lyon',      '69003', 45.00, 12, 30, TRUE),
  (3, 7, 4, '10000000003', 'Cardiologie, bilans et suivi post-opératoire.', '27 boulevard National','Marseille','13001', 55.00, 15, 30, TRUE),
  (4, 8, 5, '10000000004', 'Pédiatrie, suivi de l''enfant de 0 à 16 ans.',  '6 place du Capitole',  'Toulouse',  '31000', 30.00,  6, 20, TRUE);


-- =====================================================
--  DISPONIBILITES : du lundi au vendredi, 9h-12h et 14h-17h,
--  pour les 4 médecins (jour_semaine : 1 = lundi ... 5 = vendredi).
-- =====================================================
INSERT INTO disponibilites (medecin_id, jour_semaine, heure_debut, heure_fin)
SELECT m.id, jours.jour, creneaux.debut, creneaux.fin
FROM medecins m
CROSS JOIN (SELECT 1 AS jour UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) AS jours
CROSS JOIN (
  SELECT '09:00:00' AS debut, '12:00:00' AS fin
  UNION ALL
  SELECT '14:00:00', '17:00:00'
) AS creneaux
WHERE m.id IN (1, 2, 3, 4);


-- =====================================================
--  RENDEZ_VOUS : les trois statuts significatifs du jeu d'essai
--  (dates relatives à aujourd'hui, pour rester valides quelle que
--  soit la date de chargement de ce fichier).
-- =====================================================
INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_debut, heure_fin, statut, motif, notes_medecin, date_creation) VALUES
  -- En attente de confirmation par le médecin
  (1, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '09:30:00', 'EN_ATTENTE',
   'Douleurs abdominales récurrentes', NULL, NOW()),
  -- Confirmé, à venir
  (2, 2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '14:00:00', '14:30:00', 'CONFIRME',
   'Contrôle de grain de beauté', NULL, NOW()),
  (3, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', '10:30:00', 'CONFIRME',
   'Douleurs thoraciques à l''effort', NULL, NOW()),
  -- Terminé (passé), avec compte rendu médecin
  (1, 4, DATE_SUB(CURDATE(), INTERVAL 20 DAY), '09:00:00', '09:20:00', 'TERMINE',
   'Vaccination de rappel', 'Vaccination effectuée sans complication. RAS.', DATE_SUB(NOW(), INTERVAL 25 DAY)),
  (2, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '11:00:00', '11:30:00', 'TERMINE',
   'Renouvellement d''ordonnance', 'Renouvellement effectué, contrôle dans 6 mois.', DATE_SUB(NOW(), INTERVAL 12 DAY)),
  -- Annulé, pour couvrir également ce statut dans les données de démo
  (3, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '15:00:00', '15:30:00', 'ANNULE',
   'Consultation de suivi', NULL, DATE_SUB(NOW(), INTERVAL 6 DAY));


-- =====================================================
--  AVIS : un avis par rendez-vous TERMINE (contrainte uq_avis_rendez_vous)
-- =====================================================
INSERT INTO avis (rendez_vous_id, patient_id, medecin_id, note, commentaire)
SELECT rv.id, rv.patient_id, rv.medecin_id, note.valeur, note.commentaire
FROM rendez_vous rv
JOIN (
  SELECT 4 AS ligne, 5 AS valeur, 'Très à l''écoute, vaccination faite en douceur.' AS commentaire
  UNION ALL
  SELECT 5, 4, 'Consultation rapide et efficace.'
) AS note ON note.ligne = rv.id
WHERE rv.statut = 'TERMINE';


-- =====================================================
--  JOURNAUX_SECURITE : quelques entrées représentatives
-- =====================================================
INSERT INTO journaux_securite (utilisateur_id, type_evenement, description, adresse_ip, user_agent, date_evenement) VALUES
  (1, 'LOGIN_SUCCESS', 'Connexion réussie.', '127.0.0.1', 'seed/1.0', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (2, 'REGISTER', 'Création de compte (patient).', '127.0.0.1', 'seed/1.0', DATE_SUB(NOW(), INTERVAL 30 DAY)),
  (5, 'REGISTER', 'Création de compte (doctor).', '127.0.0.1', 'seed/1.0', DATE_SUB(NOW(), INTERVAL 28 DAY)),
  (1, 'DOCTOR_APPROVED', 'Médecin #1 validé par l''administrateur.', '127.0.0.1', 'seed/1.0', DATE_SUB(NOW(), INTERVAL 27 DAY)),
  (NULL, 'LOGIN_FAILED', 'Tentative de connexion avec une adresse e-mail inconnue.', '203.0.113.42', 'seed/1.0', DATE_SUB(NOW(), INTERVAL 2 DAY));


-- Les AUTO_INCREMENT continuent après les ID explicites ci-dessus, pour
-- que les comptes créés ensuite (via l'inscription publique ou d'autres
-- scripts) ne collisionnent jamais avec ce jeu d'essai.
ALTER TABLE utilisateurs AUTO_INCREMENT = 100;
ALTER TABLE patients AUTO_INCREMENT = 100;
ALTER TABLE medecins AUTO_INCREMENT = 100;
