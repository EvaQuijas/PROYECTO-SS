-- =============================================
-- Sistema de Gestión de Auditorías de Seguimiento
-- Esquema de base de datos PostgreSQL
-- =============================================

-- Tabla: coordinadores
CREATE TABLE IF NOT EXISTS coordinadores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: programas
CREATE TABLE IF NOT EXISTS programas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  activo BOOLEAN DEFAULT true,
  coordinador_id INTEGER REFERENCES coordinadores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  programa_id INTEGER REFERENCES programas(id) ON DELETE SET NULL,
  coordinador_id INTEGER REFERENCES coordinadores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: slots
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 20,
  disponible BOOLEAN DEFAULT true,
  coordinador_id INTEGER REFERENCES coordinadores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: citas
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
  alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
  programa_id INTEGER REFERENCES programas(id) ON DELETE SET NULL,
  agendado_por VARCHAR(20) DEFAULT 'alumno' CHECK (agendado_por IN ('alumno', 'coordinador')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asistio', 'inasistencia', 'cancelada')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: avisos
CREATE TABLE IF NOT EXISTS avisos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  programa_id INTEGER REFERENCES programas(id) ON DELETE CASCADE,
  coordinador_id INTEGER REFERENCES coordinadores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: historial
CREATE TABLE IF NOT EXISTS historial (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER REFERENCES citas(id) ON DELETE SET NULL,
  alumno_nombre VARCHAR(100),
  programa_nombre VARCHAR(100),
  fecha VARCHAR(50),
  estado VARCHAR(20),
  agendado_por VARCHAR(20) DEFAULT 'alumno',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  destinatario_email VARCHAR(100) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  enviado BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
