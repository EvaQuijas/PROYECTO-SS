const { pool } = require('../config/database');
const emailService = require('../utils/emailService');

/**
 * POST /api/citas/reservar
 * El alumno reserva un slot (el programa se toma de su perfil en el JWT)
 */
async function reservar(req, res, next) {
  try {
    const { slot_id } = req.body;
    const alumno_id = req.user.id;
    const programa_id = req.user.programa_id;

    if (!slot_id) {
      return res.status(400).json({
        success: false,
        message: 'El slot_id es requerido',
      });
    }

    if (!programa_id) {
      return res.status(400).json({
        success: false,
        message: 'No tienes un programa asignado. Contacta a tu coordinador.',
      });
    }

    const slot = await pool.query(
      `SELECT id, fecha, hora_inicio, hora_fin, disponible, coordinador_id
       FROM slots WHERE id = $1`,
      [slot_id]
    );

    if (slot.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot no encontrado',
      });
    }

    const slotData = slot.rows[0];

    if (!slotData.disponible) {
      return res.status(400).json({
        success: false,
        message: 'El slot ya no está disponible',
      });
    }

    if (slotData.coordinador_id !== req.user.coordinador_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este slot',
      });
    }

    const citaExistente = await pool.query(
      `SELECT id FROM citas WHERE slot_id = $1 AND alumno_id = $2 AND estado NOT IN ('cancelada', 'inasistencia')`,
      [slot_id, alumno_id]
    );

    if (citaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una cita en este slot',
      });
    }

    await pool.query(
      `UPDATE slots SET disponible = false WHERE id = $1`,
      [slot_id]
    );

    const programa = await pool.query(
      `SELECT nombre FROM programas WHERE id = $1`,
      [programa_id]
    );
    const programa_nombre = programa.rows[0]?.nombre || null;

    const cita = await pool.query(
      `INSERT INTO citas (slot_id, alumno_id, programa_id, agendado_por, estado)
       VALUES ($1, $2, $3, 'alumno', 'pendiente')
       RETURNING id, slot_id, alumno_id, programa_id, agendado_por, estado, created_at`,
      [slot_id, alumno_id, programa_id]
    );

    await pool.query(
      `INSERT INTO historial (cita_id, alumno_nombre, programa_nombre, fecha, estado, agendado_por)
       VALUES ($1, $2, $3, $4, 'pendiente', 'alumno')`,
      [cita.rows[0].id, req.user.nombre, programa_nombre, slotData.fecha]
    );

    return res.status(201).json({
      success: true,
      data: cita.rows[0],
      message: 'Cita reservada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/citas/agendar-manual
 * El coordinador agenda una cita (el programa se toma de la tabla alumnos)
 */
async function agendarManual(req, res, next) {
  try {
    const { slot_id, alumno_id } = req.body;
    const coordinador_id = req.user.id;

    if (!slot_id || !alumno_id) {
      return res.status(400).json({
        success: false,
        message: 'El slot_id y el alumno_id son requeridos',
      });
    }

    const slot = await pool.query(
      `SELECT id, fecha, hora_inicio, hora_fin, disponible, coordinador_id
       FROM slots WHERE id = $1 AND coordinador_id = $2`,
      [slot_id, coordinador_id]
    );

    if (slot.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot no encontrado',
      });
    }

    const slotData = slot.rows[0];

    if (!slotData.disponible) {
      return res.status(400).json({
        success: false,
        message: 'El slot ya no está disponible',
      });
    }

    const alumno = await pool.query(
      `SELECT id, nombre, email, programa_id, coordinador_id
       FROM alumnos WHERE id = $1 AND coordinador_id = $2`,
      [alumno_id, coordinador_id]
    );

    if (alumno.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado',
      });
    }

    const alumnoData = alumno.rows[0];
    const programa_id = alumnoData.programa_id;

    if (!programa_id) {
      return res.status(400).json({
        success: false,
        message: 'El alumno no tiene un programa asignado',
      });
    }

    const citaExistente = await pool.query(
      `SELECT id FROM citas WHERE slot_id = $1 AND alumno_id = $2 AND estado NOT IN ('cancelada', 'inasistencia')`,
      [slot_id, alumno_id]
    );

    if (citaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El alumno ya tiene una cita en este slot',
      });
    }

    await pool.query(
      `UPDATE slots SET disponible = false WHERE id = $1`,
      [slot_id]
    );

    const programa = await pool.query(
      `SELECT nombre FROM programas WHERE id = $1`,
      [programa_id]
    );
    const programa_nombre = programa.rows[0]?.nombre || null;

    const cita = await pool.query(
      `INSERT INTO citas (slot_id, alumno_id, programa_id, agendado_por, estado)
       VALUES ($1, $2, $3, 'coordinador', 'pendiente')
       RETURNING id, slot_id, alumno_id, programa_id, agendado_por, estado, created_at`,
      [slot_id, alumno_id, programa_id]
    );

    await pool.query(
      `INSERT INTO historial (cita_id, alumno_nombre, programa_nombre, fecha, estado, agendado_por)
       VALUES ($1, $2, $3, $4, 'pendiente', 'coordinador')`,
      [cita.rows[0].id, alumnoData.nombre, programa_nombre, slotData.fecha]
    );

    // Notificar al alumno por correo (no bloquea la respuesta si falla)
    try {
      await emailService.sendCitaAgendada(
        alumnoData,
        {
          fecha: slotData.fecha,
          hora_inicio: slotData.hora_inicio,
          hora_fin: slotData.hora_fin,
        },
        { nombre: programa_nombre }
      );
    } catch (emailError) {
      console.error('Error al enviar correo de cita agendada:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      data: cita.rows[0],
      message: 'Cita agendada manualmente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/citas/mis-citas
 * El alumno obtiene sus citas
 */
async function getMisCitas(req, res, next) {
  try {
    const alumno_id = req.user.id;

    const result = await pool.query(
      `SELECT c.id, c.slot_id, c.alumno_id, c.programa_id, c.agendado_por, c.estado, c.created_at,
              s.fecha, s.hora_inicio, s.hora_fin, s.duracion_minutos,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM citas c
       JOIN slots s ON c.slot_id = s.id
       LEFT JOIN programas p ON c.programa_id = p.id
       WHERE c.alumno_id = $1
       ORDER BY s.fecha ASC, s.hora_inicio ASC`,
      [alumno_id]
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
 * GET /api/citas/todas
 * El coordinador obtiene todas las citas de sus alumnos
 */
async function getCitasCoordinador(req, res, next) {
  try {
    const coordinador_id = req.user.id;

    const result = await pool.query(
      `SELECT c.id, c.slot_id, c.alumno_id, c.programa_id, c.agendado_por, c.estado, c.created_at,
              s.fecha, s.hora_inicio, s.hora_fin, s.duracion_minutos,
              a.nombre AS alumno_nombre, a.email AS alumno_email,
              p.nombre AS programa_nombre, p.color_hex AS programa_color
       FROM citas c
       JOIN slots s ON c.slot_id = s.id
       JOIN alumnos a ON c.alumno_id = a.id
       LEFT JOIN programas p ON c.programa_id = p.id
       WHERE s.coordinador_id = $1
       ORDER BY s.fecha ASC, s.hora_inicio ASC`,
      [coordinador_id]
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
 * PATCH /api/citas/:id/cancelar
 * Cancela una cita (el coordinador del slot o el alumno dueño de la cita)
 */
async function cancelar(req, res, next) {
  try {
    const { id } = req.params;
    const esCoordinador = req.user.role === 'coordinador';

    const cita = await pool.query(
      `SELECT c.id, c.slot_id, c.alumno_id, c.estado, c.programa_id,
              s.coordinador_id, s.fecha, s.hora_inicio
       FROM citas c
       JOIN slots s ON c.slot_id = s.id
       WHERE c.id = $1`,
      [id]
    );

    if (cita.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada',
      });
    }

    const citaData = cita.rows[0];

    if (esCoordinador) {
      if (citaData.coordinador_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta cita',
        });
      }
    } else {
      if (citaData.alumno_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta cita',
        });
      }
    }

    if (citaData.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'La cita ya está cancelada',
      });
    }

    await pool.query(
      `UPDATE citas SET estado = 'cancelada' WHERE id = $1`,
      [id]
    );

    await pool.query(
      `UPDATE slots SET disponible = true WHERE id = $1`,
      [citaData.slot_id]
    );

    const alumno = await pool.query(
      `SELECT nombre, email FROM alumnos WHERE id = $1`,
      [citaData.alumno_id]
    );
    const programa = await pool.query(
      `SELECT nombre FROM programas WHERE id = $1`,
      [citaData.programa_id]
    );

    await pool.query(
      `INSERT INTO historial (cita_id, alumno_nombre, programa_nombre, fecha, estado, agendado_por)
       VALUES ($1, $2, $3, $4, 'cancelada', $5)`,
      [
        id,
        alumno.rows[0]?.nombre || null,
        programa.rows[0]?.nombre || null,
        citaData.fecha,
        esCoordinador ? 'coordinador' : 'alumno',
      ]
    );

    // Notificar al alumno por correo (no bloquea la respuesta si falla)
    try {
      await emailService.sendCitaCancelada(
        alumno.rows[0],
        {
          fecha: citaData.fecha,
          hora_inicio: citaData.hora_inicio,
        },
        { nombre: programa.rows[0]?.nombre || null }
      );
    } catch (emailError) {
      console.error('Error al enviar correo de cancelación:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Cita cancelada',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/citas/:id/asistencia
 * El coordinador registra asistencia (NO libera el slot)
 */
async function registrarAsistencia(req, res, next) {
  try {
    const { id } = req.params;
    const coordinador_id = req.user.id;

    const cita = await pool.query(
      `SELECT c.id, c.slot_id, c.alumno_id, c.programa_id, c.estado,
              s.coordinador_id, s.fecha
       FROM citas c
       JOIN slots s ON c.slot_id = s.id
       WHERE c.id = $1 AND s.coordinador_id = $2`,
      [id, coordinador_id]
    );

    if (cita.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada',
      });
    }

    const citaData = cita.rows[0];

    if (citaData.estado === 'asistio' || citaData.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado de esta cita',
      });
    }

    await pool.query(
      `UPDATE citas SET estado = 'asistio' WHERE id = $1`,
      [id]
    );

    const alumno = await pool.query(
      `SELECT nombre FROM alumnos WHERE id = $1`,
      [citaData.alumno_id]
    );
    const programa = await pool.query(
      `SELECT nombre FROM programas WHERE id = $1`,
      [citaData.programa_id]
    );

    await pool.query(
      `INSERT INTO historial (cita_id, alumno_nombre, programa_nombre, fecha, estado, agendado_por)
       VALUES ($1, $2, $3, $4, 'asistio', 'coordinador')`,
      [
        id,
        alumno.rows[0]?.nombre || null,
        programa.rows[0]?.nombre || null,
        citaData.fecha,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Asistencia registrada',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/citas/:id/inasistencia
 * El coordinador registra inasistencia (libera el slot)
 */
async function registrarInasistencia(req, res, next) {
  try {
    const { id } = req.params;
    const coordinador_id = req.user.id;

    const cita = await pool.query(
      `SELECT c.id, c.slot_id, c.alumno_id, c.programa_id, c.estado,
              s.coordinador_id, s.fecha
       FROM citas c
       JOIN slots s ON c.slot_id = s.id
       WHERE c.id = $1 AND s.coordinador_id = $2`,
      [id, coordinador_id]
    );

    if (cita.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada',
      });
    }

    const citaData = cita.rows[0];

    if (citaData.estado === 'inasistencia' || citaData.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado de esta cita',
      });
    }

    await pool.query(
      `UPDATE citas SET estado = 'inasistencia' WHERE id = $1`,
      [id]
    );

    await pool.query(
      `UPDATE slots SET disponible = true WHERE id = $1`,
      [citaData.slot_id]
    );

    const alumno = await pool.query(
      `SELECT nombre FROM alumnos WHERE id = $1`,
      [citaData.alumno_id]
    );
    const programa = await pool.query(
      `SELECT nombre FROM programas WHERE id = $1`,
      [citaData.programa_id]
    );

    await pool.query(
      `INSERT INTO historial (cita_id, alumno_nombre, programa_nombre, fecha, estado, agendado_por)
       VALUES ($1, $2, $3, $4, 'inasistencia', 'coordinador')`,
      [
        id,
        alumno.rows[0]?.nombre || null,
        programa.rows[0]?.nombre || null,
        citaData.fecha,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Inasistencia registrada',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/citas/historial
 * Elimina del historial las citas finalizadas (asistio, inasistencia, cancelada)
 * que pertenecen a los slots del coordinador autenticado.
 * Las citas cambiadas a estos estados por el alumno también se eliminan,
 * ya que el filtro se aplica por el dueño del slot y no por quién cambió el estado.
 */
async function deleteHistorial(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM citas c
       USING slots s
       WHERE c.slot_id = s.id
         AND s.coordinador_id = $1
         AND c.estado IN ('asistio', 'inasistencia', 'cancelada')
       RETURNING c.id`,
      [req.user.id]
    );

    // Liberar los slots cuyas citas se eliminaron (quedan disponibles de nuevo)
    await pool.query(
      `UPDATE slots SET disponible = true
       WHERE coordinador_id = $1
         AND id NOT IN (SELECT slot_id FROM citas WHERE slot_id IS NOT NULL)`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: `${result.rows.length} citas eliminadas del historial`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  reservar,
  agendarManual,
  getMisCitas,
  getCitasCoordinador,
  cancelar,
  registrarAsistencia,
  registrarInasistencia,
  deleteHistorial,
};