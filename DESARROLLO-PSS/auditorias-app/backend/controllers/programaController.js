const { pool } = require('../config/database');

/**
 * GET /api/programas
 * Obtiene todos los programas del coordinador autenticado
 */
async function getAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, nombre, color_hex, activo, coordinador_id, created_at
       FROM programas
       WHERE coordinador_id = $1
       ORDER BY nombre ASC`,
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
 * GET /api/programas/:id
 * Obtiene un programa por ID verificando que pertenezca al coordinador
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, nombre, color_hex, activo, coordinador_id, created_at
       FROM programas
       WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programa no encontrado',
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
 * POST /api/programas
 * Crea un nuevo programa para el coordinador autenticado
 */
async function create(req, res, next) {
  try {
    const { nombre, color_hex } = req.body;

    // Validar que nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del programa es requerido',
      });
    }

    // Validar formato HEX del color
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (!color_hex || !hexRegex.test(color_hex)) {
      return res.status(400).json({
        success: false,
        message: 'El color debe tener formato HEX válido (ej: #1976d2)',
      });
    }

    // Verificar que no exista otro programa con el mismo nombre para este coordinador
    const existing = await pool.query(
      `SELECT id FROM programas
       WHERE nombre = $1 AND coordinador_id = $2`,
      [nombre.trim(), req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un programa con ese nombre',
      });
    }

    // Crear el nuevo programa
    const result = await pool.query(
      `INSERT INTO programas (nombre, color_hex, activo, coordinador_id)
       VALUES ($1, $2, true, $3)
       RETURNING id, nombre, color_hex, activo, coordinador_id, created_at`,
      [nombre.trim(), color_hex, req.user.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Programa creado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/programas/:id
 * Actualiza un programa verificando que pertenezca al coordinador
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, color_hex, activo } = req.body;

    // Verificar que el programa exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM programas
       WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programa no encontrado',
      });
    }

    // Validar nombre si viene
    if (nombre !== undefined && nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del programa no puede estar vacío',
      });
    }

    // Validar color_hex si viene
    if (color_hex !== undefined) {
      const hexRegex = /^#[0-9A-F]{6}$/i;
      if (!hexRegex.test(color_hex)) {
        return res.status(400).json({
          success: false,
          message: 'El color debe tener formato HEX válido (ej: #1976d2)',
        });
      }
    }

    // Verificar que no exista otro programa con el mismo nombre (excluyendo el actual)
    if (nombre !== undefined) {
      const duplicate = await pool.query(
        `SELECT id FROM programas
         WHERE nombre = $1 AND coordinador_id = $2 AND id != $3`,
        [nombre.trim(), req.user.id, id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un programa con ese nombre',
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
    if (color_hex !== undefined) {
      updates.push(`color_hex = $${paramIndex++}`);
      params.push(color_hex);
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramIndex++}`);
      params.push(activo);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar',
      });
    }

    params.push(id, req.user.id);
    const result = await pool.query(
      `UPDATE programas
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND coordinador_id = $${paramIndex}
       RETURNING id, nombre, color_hex, activo, coordinador_id, created_at`,
      params
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Programa actualizado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/programas/:id/toggle
 * Cambia el estado activo (true ↔ false) de un programa
 */
async function toggleActive(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el programa exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id, activo FROM programas
       WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programa no encontrado',
      });
    }

    // Cambiar el estado activo
    const nuevoEstado = !existing.rows[0].activo;
    const result = await pool.query(
      `UPDATE programas
       SET activo = $1
       WHERE id = $2 AND coordinador_id = $3
       RETURNING id, nombre, color_hex, activo, coordinador_id, created_at`,
      [nuevoEstado, id, req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Estado actualizado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/programas/:id
 * Elimina un programa verificando que pertenezca al coordinador
 */
async function deletePrograma(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el programa exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM programas
       WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programa no encontrado',
      });
    }

    // Eliminar el programa
    await pool.query(
      `DELETE FROM programas WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Programa eliminado',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggleActive,
  delete: deletePrograma,
};
