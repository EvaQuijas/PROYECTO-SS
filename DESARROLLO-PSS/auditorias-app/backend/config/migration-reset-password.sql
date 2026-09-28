-- Migración: Recuperación de contraseña
ALTER TABLE coordinadores ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE coordinadores ADD COLUMN IF NOT EXISTS reset_token_expira TIMESTAMP;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS reset_token_expira TIMESTAMP;