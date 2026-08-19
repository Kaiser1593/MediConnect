-- =====================================================
--  Migration : ajout de la table security_logs
--  À appliquer sur une base mediconnect déjà existante,
--  sans avoir à recharger tout le schéma.
-- =====================================================

USE mediconnect;

CREATE TABLE security_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  event_type VARCHAR(50) NOT NULL,
  message    VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_security_logs_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_security_logs_type (event_type, created_at),
  INDEX idx_security_logs_user (user_id)
) ENGINE = InnoDB;
