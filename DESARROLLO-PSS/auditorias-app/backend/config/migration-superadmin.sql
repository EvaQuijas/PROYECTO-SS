-- =============================================
-- Migración: Coordinador Principal (Superadmin)
-- =============================================
-- Agrega las columnas necesarias para soportar la figura del
-- coordinador principal, que además de gestionar su propio espacio
-- puede dar de alta y administrar a otros coordinadores.
--
-- Ejecutar con: node config/run-migration.js
-- =============================================

-- Columna: es_principal
-- Marca al coordinador que tiene privilegios de superadministrador
ALTER TABLE coordinadores
  ADD COLUMN IF NOT EXISTS es_principal BOOLEAN DEFAULT false;

-- Columna: activo
-- Permite activar/desactivar coordinadores sin eliminarlos
ALTER TABLE coordinadores
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Normalizar valores nulos en registros preexistentes
UPDATE coordinadores SET es_principal = false WHERE es_principal IS NULL;
UPDATE coordinadores SET activo = true WHERE activo IS NULL;

-- Designar a Oscar como coordinador principal
UPDATE coordinadores
  SET es_principal = true
  WHERE email = 'coordinador@institucion.edu';

-- Índice para acelerar las búsquedas del coordinador principal
CREATE INDEX IF NOT EXISTS idx_coordinadores_es_principal
  ON coordinadores (es_principal);
