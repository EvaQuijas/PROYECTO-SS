const { pool } = require('../config/database');
const emailService = require('../utils/emailService');

/**
 * GET /api/avisos
 * Obtiene todos los avisos del coordinador autenticado (con info del programa)
 */
async function getAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.titulo, a.contenido, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM avisos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.coordinador_id = $1
       ORDER BY a.created_at DESC`,
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
 * GET /api/avisos/programa/:programa_id
 * Obtiene avisos del coordinador filtrados por programa
 */
async function getByPrograma(req, res, next) {
  try {
    const { programa_id } = req.params;

    const result = await pool.query(
      `SELECT a.id, a.titulo, a.contenido, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM avisos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.coordinador_id = $1 AND a.programa_id = $2
       ORDER BY a.created_at DESC`,
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
 * GET /api/avisos/globales
 * Obtiene los avisos globales (programa_id = NULL) del coordinador
 */
async function getGlobales(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.titulo, a.contenido, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM avisos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE a.coordinador_id = $1 AND a.programa_id IS NULL
       ORDER BY a.created_at DESC`,
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
 * GET /api/avisos/mis-avisos
 * PARA ALUMNOS: obtiene avisos globales + avisos del programa del alumno
 */
async function getParaAlumno(req, res, next) {
  try {
    const alumno_programa_id = req.user.programa_id;

    const result = await pool.query(
      `SELECT a.id, a.titulo, a.contenido, a.programa_id, a.coordinador_id, a.created_at,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM avisos a
       LEFT JOIN programas p ON a.programa_id = p.id
       WHERE (a.programa_id IS NULL
              OR a.programa_id = $1)
       ORDER BY a.created_at DESC`,
      [alumno_programa_id]
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
 * POST /api/avisos
 * Crea un nuevo aviso (global si programa_id es null, o dirigido a un programa)
 */
async function create(req, res, next) {
  try {
    const { titulo, contenido, programa_id } = req.body;

    // Validar campos
    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título del aviso es requerido',
      });
    }

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El contenido del aviso es requerido',
      });
    }

    // Normalizar programa_id: si está vacío o null, se guarda como global (NULL)
    let programaIdFinal = null;
    if (programa_id !== undefined && programa_id !== null && programa_id !== '') {
      programaIdFinal = programa_id;

      // Verificar que el programa exista y pertenezca al coordinador
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

    // Crear el aviso
    const result = await pool.query(
      `INSERT INTO avisos (titulo, contenido, programa_id, coordinador_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, contenido, programa_id, coordinador_id, created_at`,
      [titulo.trim(), contenido.trim(), programaIdFinal, req.user.id]
    );

    const nuevoAviso = result.rows[0];

    // Obtener información del programa si aplica
    let programa_nombre = null;
    let programa_color = null;
    if (nuevoAviso.programa_id) {
      const prog = await pool.query(
        `SELECT nombre, color_hex FROM programas WHERE id = $1`,
        [nuevoAviso.programa_id]
      );
      if (prog.rows.length > 0) {
        programa_nombre = prog.rows[0].nombre;
        programa_color = prog.rows[0].color_hex;
      }
    }

    // Notificar a los alumnos por correo (no bloquea la respuesta si falla)
    // Global => todos los alumnos del coordinador; con programa => solo los de ese programa
    try {
      const alumnosQuery = programaIdFinal
        ? await pool.query(
            `SELECT nombre, email FROM alumnos
             WHERE coordinador_id = $1 AND programa_id = $2`,
            [req.user.id, programaIdFinal]
          )
        : await pool.query(
            `SELECT nombre, email FROM alumnos WHERE coordinador_id = $1`,
            [req.user.id]
          );

      await emailService.sendAvisoNuevo(
        alumnosQuery.rows,
        { titulo: titulo.trim(), contenido: contenido.trim() },
        programa_nombre ? { nombre: programa_nombre } : null
      );
    } catch (emailError) {
      console.error('Error al enviar correo de aviso:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        ...nuevoAviso,
        programa_nombre,
        programa_color,
      },
      message: 'Aviso creado',
    });
  } catch (error) {
    next(error);
  }
}


/**
 * PUT /api/avisos/:id
 * Actualiza un aviso verificando que pertenezca al coordinador
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { titulo, contenido, programa_id } = req.body;

    // Verificar que el aviso exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM avisos WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado',
      });
    }

    // Validar título si viene
    if (titulo !== undefined && titulo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título del aviso no puede estar vacío',
      });
    }

    // Validar contenido si viene
    if (contenido !== undefined && contenido.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El contenido del aviso no puede estar vacío',
      });
    }

    // Si programa_id viene, verificar que exista y pertenezca al coordinador
    let programaIdFinal;
    if (programa_id !== undefined) {
      if (programa_id === null || programa_id === '') {
        // Vaciar programa_id = vuelve a ser un aviso global
        programaIdFinal = null;
      } else {
        programaIdFinal = programa_id;
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
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (titulo !== undefined) {
      updates.push(`titulo = $${paramIndex++}`);
      params.push(titulo.trim());
    }
    if (contenido !== undefined) {
      updates.push(`contenido = $${paramIndex++}`);
      params.push(contenido.trim());
    }
    if (programa_id !== undefined) {
      updates.push(`programa_id = $${paramIndex++}`);
      params.push(programaIdFinal);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar',
      });
    }

    params.push(id, req.user.id);
    const result = await pool.query(
      `UPDATE avisos
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND coordinador_id = $${paramIndex}
       RETURNING id, titulo, contenido, programa_id, coordinador_id, created_at`,
      params
    );

    const avisoActualizado = result.rows[0];

    // Obtener información del programa si aplica
    let programa_nombre = null;
    let programa_color = null;
    if (avisoActualizado.programa_id) {
      const prog = await pool.query(
        `SELECT nombre, color_hex FROM programas WHERE id = $1`,
        [avisoActualizado.programa_id]
      );
      if (prog.rows.length > 0) {
        programa_nombre = prog.rows[0].nombre;
        programa_color = prog.rows[0].color_hex;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...avisoActualizado,
        programa_nombre,
        programa_color,
      },
      message: 'Aviso actualizado',
    });
  } catch (error) {
    next(error);
  }
}


/**
 * DELETE /api/avisos/:id
 * Elimina un aviso verificando que pertenezca al coordinador
 */
async function deleteAviso(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el aviso exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id FROM avisos WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado',
      });
    }

    // Eliminar el aviso
    await pool.query(
      `DELETE FROM avisos WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Aviso eliminado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/avisos/all
 * Elimina TODOS los avisos del coordinador autenticado
 */
async function deleteAll(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM avisos WHERE coordinador_id = $1 RETURNING id`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: `${result.rows.length} avisos eliminados`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getByPrograma,
  getGlobales,
  getParaAlumno,
  create,
  update,
  delete: deleteAviso,
  deleteAll,
};

