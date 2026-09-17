const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

// ContraseÃ±a temporal asignada a los nuevos coordinadores y en los reseteos
const PASSWORD_TEMPORAL = '123456';

// ExpresiÃ³n regular para validar email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/coordinadores
 * Lista todos los coordinadores registrados (sin password_hash).
 * Solo accesible para el coordinador principal.
 */
async function getAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, nombre, email, es_principal, activo, created_at
       FROM coordinadores
       ORDER BY es_principal DESC, nombre ASC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/coordinadores
 * Crea un nuevo coordinador con contraseÃ±a temporal.
 * Solo accesible para el coordinador principal.
 */
async function create(req, res, next) {
  const { nombre, email, password } = req.body;

  try {
    // 1. Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido',
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El email no tiene un formato vÃ¡lido',
      });
    }

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    // 2. Validar que el email no exista (ni en coordinadores ni en alumnos)
    const existente = await pool.query(
      `SELECT id FROM coordinadores WHERE LOWER(email) = $1
       UNION ALL
       SELECT id FROM alumnos WHERE LOWER(email) = $1`,
      [emailLimpio]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya estÃ¡ registrado',
      });
    }

    // 3. Usar la contraseÃ±a proporcionada o la temporal por defecto
    const passwordFinal = password && String(password).trim() !== ''
      ? String(password)
      : PASSWORD_TEMPORAL;

    const passwordHash = await bcrypt.hash(passwordFinal, SALT_ROUNDS);

    // 4. Insertar el nuevo coordinador (nunca como principal, siempre activo)
    const result = await pool.query(
      `INSERT INTO coordinadores (nombre, email, password_hash, es_principal, activo)
       VALUES ($1, $2, $3, false, true)
       RETURNING id, nombre, email, es_principal, activo, created_at`,
      [nombreLimpio, emailLimpio, passwordHash]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Coordinador creado exitosamente',
      password_temporal: passwordFinal,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/coordinadores/:id/toggle
 * Activa o desactiva un coordinador. El principal no puede desactivarse a sÃ­ mismo.
 */
async function toggleActivo(req, res, next) {
  const { id } = req.params;

  try {
    const numId = Number(id);
    if (Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El id del coordinador debe ser un nÃºmero vÃ¡lido',
      });
    }

    // 1. No puede desactivarse a sÃ­ mismo
    if (numId === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta',
      });
    }

    // 2. Buscar el coordinador objetivo
    const actual = await pool.query(
      `SELECT id, nombre, email, es_principal, activo
       FROM coordinadores WHERE id = $1`,
      [numId]
    );

    if (actual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coordinador no encontrado',
      });
    }

    const coordinador = actual.rows[0];

    // 3. Salvaguarda: no desactivar a otro coordinador principal
    if (coordinador.es_principal === true && coordinador.activo === true) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar a un coordinador principal',
      });
    }

    // 4. Invertir el estado
    const result = await pool.query(
      `UPDATE coordinadores
       SET activo = NOT COALESCE(activo, true)
       WHERE id = $1
       RETURNING id, nombre, email, es_principal, activo, created_at`,
      [numId]
    );

    const actualizado = result.rows[0];

    return res.status(200).json({
      success: true,
      data: actualizado,
      message: actualizado.activo
        ? `Coordinador "${actualizado.nombre}" activado correctamente`
        : `Coordinador "${actualizado.nombre}" desactivado correctamente`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/coordinadores/:id/reset-password
 * Restablece la contraseÃ±a de un coordinador a la temporal (123456).
 */
async function resetPassword(req, res, next) {
  const { id } = req.params;

  try {
    const numId = Number(id);
    if (Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El id del coordinador debe ser un nÃºmero vÃ¡lido',
      });
    }

    // No permitir resetear la contraseÃ±a propia desde este endpoint
    if (numId === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes restablecer tu propia contraseÃ±a desde aquÃ­',
      });
    }

    const existe = await pool.query(
      'SELECT id, nombre, email FROM coordinadores WHERE id = $1',
      [numId]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coordinador no encontrado',
      });
    }

    const passwordHash = await bcrypt.hash(PASSWORD_TEMPORAL, SALT_ROUNDS);

    await pool.query(
      'UPDATE coordinadores SET password_hash = $1 WHERE id = $2',
      [passwordHash, numId]
    );

    return res.status(200).json({
      success: true,
      message: `ContraseÃ±a de "${existe.rows[0].nombre}" restablecida correctamente`,
      new_password: PASSWORD_TEMPORAL,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/coordinadores/:id
 * Elimina un coordinador y todos sus datos asociados (ON DELETE CASCADE).
 */
async function deleteCoordinador(req, res, next) {
  const { id } = req.params;

  try {
    const numId = Number(id);
    if (Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El id del coordinador debe ser un nÃºmero vÃ¡lido',
      });
    }

    // 1. No puede eliminarse a sÃ­ mismo
    if (numId === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta',
      });
    }

    // 2. Buscar el coordinador objetivo
    const existe = await pool.query(
      `SELECT id, nombre, email, es_principal
       FROM coordinadores WHERE id = $1`,
      [numId]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coordinador no encontrado',
      });
    }

    // 3. Salvaguarda: nunca eliminar a un coordinador principal
    if (existe.rows[0].es_principal === true) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar a un coordinador principal',
      });
    }

    // 4. Eliminar (programas, alumnos, slots, citas y avisos caen en cascada)
    await pool.query('DELETE FROM coordinadores WHERE id = $1', [numId]);

    return res.status(200).json({
      success: true,
      message: `Coordinador "${existe.rows[0].nombre}" eliminado correctamente`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  create,
  toggleActivo,
  resetPassword,
  delete: deleteCoordinador,
};
