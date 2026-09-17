const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;
const PASSWORD_TEMPORAL = '123456';

/**
 * GET /api/alumnos
 * Obtiene todos los alumnos del coordinador autenticado
 */
async function getAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM alumnos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.coordinador_id = $1
       ORDER BY a.nombre ASC`,
      [req.user.id]
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
 * GET /api/alumnos/:id
 * Obtiene un alumno por ID verificando que pertenezca al coordinador
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM alumnos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.id = $1 AND a.coordinador_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/alumnos/programa/:programa_id
 * Obtiene alumnos del coordinador filtrados por programa
 */
async function getByPrograma(req, res, next) {
  try {
    const { programa_id } = req.params;

    // Verificar que el programa exista y pertenezca al coordinador
    const programa = await pool.query(
      `SELECT id FROM programas WHERE id = $1 AND coordinador_id = $2`,
      [programa_id, req.user.id]
    );

    if (programa.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programa no encontrado',
      });
    }

    const result = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM alumnos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.coordinador_id = $1 AND a.programa_id = $2
       ORDER BY a.nombre ASC`,
      [req.user.id, programa_id]
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
 * POST /api/alumnos
 * Crea un nuevo alumno con contraseña temporal
 */
async function create(req, res, next) {
  try {
    const { nombre, email, programa_id } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del alumno es requerido',
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El email del alumno es requerido',
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El email no tiene un formato válido',
      });
    }

    // Verificar que el programa exista y pertenezca al coordinador (si se proporciona)
    if (programa_id) {
      const programa = await pool.query(
        `SELECT id FROM programas WHERE id = $1 AND coordinador_id = $2`,
        [programa_id, req.user.id]
      );

      if (programa.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El programa seleccionado no existe o no pertenece al coordinador',
        });
      }
    }

    // Verificar que el email no esté duplicado para este coordinador
    const existing = await pool.query(
      `SELECT id FROM alumnos WHERE email = $1 AND coordinador_id = $2`,
      [email.trim(), req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un alumno con ese email',
      });
    }

    // Generar hash de la contraseña temporal
    const passwordHash = await bcrypt.hash(PASSWORD_TEMPORAL, SALT_ROUNDS);

    // Insertar el nuevo alumno
    const result = await pool.query(
      `INSERT INTO alumnos (nombre, email, password_hash, programa_id, coordinador_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, programa_id, coordinador_id, created_at`,
      [nombre.trim(), email.trim(), passwordHash, programa_id || null, req.user.id]
    );

    const nuevoAlumno = result.rows[0];

    // Obtener nombre del programa para la respuesta
    let programaNombre = null;
    if (nuevoAlumno.programa_id) {
      const prog = await pool.query(
        `SELECT nombre FROM programas WHERE id = $1`,
        [nuevoAlumno.programa_id]
      );
      programaNombre = prog.rows[0]?.nombre || null;
    }

    return res.status(201).json({
      success: true,
      data: {
        ...nuevoAlumno,
        programa_nombre: programaNombre,
      },
      message: 'Alumno creado exitosamente',
      password_temporal: PASSWORD_TEMPORAL,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/alumnos/:id
 * Actualiza un alumno verificando que pertenezca al coordinador
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, email, programa_id } = req.body;

    // Verificar que el alumno exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM alumnos WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado',
      });
    }

    // Validar nombre si viene
    if (nombre !== undefined && nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del alumno no puede estar vacío',
      });
    }

    // Validar email si viene
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'El email no tiene un formato válido',
        });
      }

      // Verificar que el email no esté duplicado (excluyendo el actual)
      const duplicate = await pool.query(
        `SELECT id FROM alumnos
         WHERE email = $1 AND coordinador_id = $2 AND id != $3`,
        [email.trim(), req.user.id, id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un alumno con ese email',
        });
      }
    }

    // Verificar que el programa exista y pertenezca al coordinador (si se proporciona)
    if (programa_id !== undefined && programa_id !== null) {
      const programa = await pool.query(
        `SELECT id FROM programas WHERE id = $1 AND coordinador_id = $2`,
        [programa_id, req.user.id]
      );

      if (programa.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El programa seleccionado no existe o no pertenece al coordinador',
        });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      params.push(nombre.trim());
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email.trim());
    }
    if (programa_id !== undefined) {
      updates.push(`programa_id = $${paramIndex++}`);
      params.push(programa_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar',
      });
    }

    params.push(id, req.user.id);
    const result = await pool.query(
      `UPDATE alumnos
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND coordinador_id = $${paramIndex}
       RETURNING id, nombre, email, programa_id, coordinador_id, created_at`,
      params
    );

    // Obtener nombre del programa para la respuesta
    const alumnoActualizado = result.rows[0];
    let programaNombre = null;
    if (alumnoActualizado.programa_id) {
      const prog = await pool.query(
        `SELECT nombre FROM programas WHERE id = $1`,
        [alumnoActualizado.programa_id]
      );
      programaNombre = prog.rows[0]?.nombre || null;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...alumnoActualizado,
        programa_nombre: programaNombre,
      },
      message: 'Alumno actualizado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/alumnos/:id
 * Elimina un alumno verificando que pertenezca al coordinador
 */
async function deleteAlumno(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el alumno exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM alumnos WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado',
      });
    }

    // Eliminar el alumno
    await pool.query(
      `DELETE FROM alumnos WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Alumno eliminado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/alumnos/all
 * Elimina TODOS los alumnos del coordinador autenticado.
 * Nota: las citas asociadas se eliminan en cascada (citas.alumno_id ON DELETE CASCADE)
 * y el historial conserva el registro con cita_id = NULL.
 */
async function deleteAll(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM alumnos WHERE coordinador_id = $1 RETURNING id`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: `${result.rows.length} alumnos eliminados`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/alumnos/:id/reset-password
 * Restablece la contraseña de un alumno a la temporal
 */
async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el alumno exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM alumnos WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado',
      });
    }

    // Generar nuevo hash de la contraseña temporal
    const passwordHash = await bcrypt.hash(PASSWORD_TEMPORAL, SALT_ROUNDS);

    // Actualizar la contraseña
    await pool.query(
      `UPDATE alumnos SET password_hash = $1 WHERE id = $2`,
      [passwordHash, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Contraseña restablecida',
      new_password: PASSWORD_TEMPORAL,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  getByPrograma,
  create,
  update,
  delete: deleteAlumno,
  deleteAll,
  resetPassword,
};
