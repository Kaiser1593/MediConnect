-- =====================================================
--  Migration : ajout de la table password_resets
--  À appliquer sur une base mediconnect déjà existante,
--  sans avoir à recharger tout le schéma.
-- =====================================================

USE mediconnect;

CREATE TABLE password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash CHAR(64)     NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used_at    TIMESTAMP    NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_password_resets_token (token_hash),
  INDEX idx_password_resets_user (user_id)
) ENGINE = InnoDB;
