/**
 * Middleware de validación para programas y alumnos
 */

// Expresión regular para validar color HEX (#XXXXXX)
const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

// Expresión regular para validar email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida los campos de un programa (nombre y color_hex)
 * Se usa en la creación de programas
 */
function validatePrograma(req, res, next) {
  const { nombre, color_hex } = req.body;
  const errors = [];

  // Validar nombre
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre del programa es requerido');
  } else if (nombre.trim().length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  // Validar color_hex
  if (!color_hex) {
    errors.push('El color del programa es requerido');
  } else if (!HEX_COLOR_REGEX.test(color_hex)) {
    errors.push('El color debe tener formato HEX válido (ej: #1976d2)');
  }

  // Si hay errores, responder 400 con la lista
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }

  next();
}

/**
 * Valida los campos de un alumno (nombre, email, programa_id)
 * Se usa en la creación y actualización de alumnos
 */
function validateAlumno(req, res, next) {
  const { nombre, email, programa_id } = req.body;
  const errors = [];

  // Validar nombre (solo en creación, en update puede ser parcial)
  if (req.method === 'POST') {
    if (!nombre || nombre.trim() === '') {
      errors.push('El nombre del alumno es requerido');
    } else if (nombre.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
  } else if (nombre !== undefined && nombre.trim() === '') {
    errors.push('El nombre del alumno no puede estar vacío');
  }

  // Validar email
  if (req.method === 'POST') {
    if (!email || email.trim() === '') {
      errors.push('El email del alumno es requerido');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('El email no tiene un formato válido');
    }
  } else if (email !== undefined && !EMAIL_REGEX.test(email)) {
    errors.push('El email no tiene un formato válido');
  }

  // Validar programa_id (si se proporciona)
  if (programa_id !== undefined && programa_id !== null) {
    const num = Number(programa_id);
    if (isNaN(num) || num <= 0) {
      errors.push('El programa_id debe ser un número válido');
    }
  }

  // Si hay errores, responder 400 con la lista
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }

  next();
}

module.exports = {
  validatePrograma,
  validateAlumno,
};
