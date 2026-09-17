const { pool } = require('../config/database');
const {
  getSemana,
  getFechasSemana,
  sumarMinutos,
  compararHoras,
  formatDate,
} = require('../utils/dateUtils');

// Duraciones válidas para slots
const DURACIONES_VALIDAS = [15, 20, 30, 45, 60];

/**
 * GET /api/slots/semana?fecha=YYYY-MM-DD
 * Obtiene todos los slots del coordinador para la semana de la fecha dada
 */
async function getSlotsSemana(req, res, next) {
  try {
    const { fecha } = req.query;
    const fechaBase = fecha || formatDate(new Date());

    // Calcular lunes y domingo de la semana
    const { lunes, domingo } = getSemana(fechaBase);

    // Para un coordinador se buscan sus propios slots (id); para un alumno,
    // los slots de su coordinador (coordinador_id del JWT)
    const propietarioId =
      req.user.role === 'alumno' ? req.user.coordinador_id : req.user.id;

    // Obtener slots con información de citas y alumnos
    const result = await pool.query(
      `SELECT 
         s.id, s.fecha, s.hora_inicio, s.hora_fin, s.duracion_minutos, s.disponible, 
         s.coordinador_id, s.created_at,
         c.id as cita_id,
         a.nombre as alumno_nombre,
         a.email as alumno_email,
         p.nombre as programa_nombre,
         p.color_hex as programa_color
       FROM slots s
       LEFT JOIN citas c ON c.slot_id = s.id AND c.estado IN ('pendiente', 'asistio')
       LEFT JOIN alumnos a ON a.id = c.alumno_id
       LEFT JOIN programas p ON p.id = c.programa_id
       WHERE s.coordinador_id = $1
         AND s.fecha >= $2
         AND s.fecha <= $3
       ORDER BY s.fecha ASC, s.hora_inicio ASC`,
      [propietarioId, lunes, domingo]
    );

    // Si es alumno, ocultar información sensible
    let slots = result.rows;
    if (req.user.role === 'alumno') {
      slots = slots.map(slot => {
        const nuevoSlot = { ...slot };
        if (!slot.disponible) {
          // Ocultar nombre y email del alumno que ocupó el slot
          nuevoSlot.alumno_nombre = 'Ocupado';
          delete nuevoSlot.alumno_email;
          // Mantener programa_nombre y programa_color para que sepa qué tipo de auditoría es
        }
        return nuevoSlot;
      });
    }

    return res.status(200).json({
      success: true,
      data: slots,
      semana: { inicio: lunes, fin: domingo },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/slots/rango
 * Genera slots automáticamente para un rango de horas y días de la semana
 */
async function generarRango(req, res, next) {
  try {
    const { fecha_inicio, hora_inicio, hora_fin, duracion_minutos, dias_semana } = req.body;

    // Validaciones
    if (!fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio es requerida',
      });
    }

    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Las horas de inicio y fin son requeridas',
      });
    }

    if (compararHoras(hora_inicio, hora_fin) >= 0) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio debe ser anterior a la hora de fin',
      });
    }

    if (!DURACIONES_VALIDAS.includes(Number(duracion_minutos))) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser una de: 15, 20, 30, 45, 60 minutos',
      });
    }

    if (!dias_semana || !Array.isArray(dias_semana) || dias_semana.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos un día de la semana',
      });
    }

    // Validar que los días estén en el rango 1-5
    const diasValidos = dias_semana.every((d) => d >= 1 && d <= 5);
    if (!diasValidos) {
      return res.status(400).json({
        success: false,
        message: 'Los días de la semana deben estar entre 1 (Lunes) y 5 (Viernes)',
      });
    }

    // Obtener las fechas de los días especificados
    const fechas = getFechasSemana(fecha_inicio, dias_semana);

    // Generar slots para cada fecha
    const slotsCreados = [];
    let horaActual = hora_inicio;

    for (const fecha of fechas) {
      horaActual = hora_inicio;

      while (compararHoras(horaActual, hora_fin) < 0) {
        // Calcular hora_fin del slot
        const horaFinSlot = sumarMinutos(horaActual, Number(duracion_minutos));

        // Si la hora fin del slot excede la hora_fin del rango, no crear
        if (compararHoras(horaFinSlot, hora_fin) > 0) {
          break;
        }

        // Verificar si ya existe un slot en la misma fecha y hora
        const existing = await pool.query(
          `SELECT id FROM slots
           WHERE coordinador_id = $1 AND fecha = $2 AND hora_inicio = $3`,
          [req.user.id, fecha, horaActual]
        );

        if (existing.rows.length === 0) {
          const result = await pool.query(
            `INSERT INTO slots (fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id)
             VALUES ($1, $2, $3, $4, true, $5)
             RETURNING id, fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id`,
            [fecha, horaActual, horaFinSlot, Number(duracion_minutos), req.user.id]
          );
          slotsCreados.push(result.rows[0]);
        }

        // Avanzar a la siguiente hora
        horaActual = horaFinSlot;
      }
    }

    return res.status(201).json({
      success: true,
      data: slotsCreados,
      message: `${slotsCreados.length} slots generados`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/slots/:id
 * Elimina un slot verificando que pertenezca al coordinador y esté disponible
 */
async function eliminarSlot(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el slot exista y pertenezca al coordinador
    const existing = await pool.query(
      `SELECT id, disponible FROM slots
       WHERE id = $1 AND coordinador_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot no encontrado',
      });
    }

    // Verificar que el slot esté disponible (sin cita)
    if (!existing.rows[0].disponible) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un slot con cita asignada',
      });
    }

    // Eliminar el slot
    await pool.query(
      `DELETE FROM slots WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Slot eliminado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/slots/eliminar-rango
 * Elimina slots disponibles que cumplan con los criterios del rango
 */
async function eliminarRango(req, res, next) {
  try {
    const { fecha_inicio, fecha_fin, hora_inicio, hora_fin, dias_semana } = req.body;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y fin son requeridas',
      });
    }

    // Construir la consulta de eliminación
    let query = `DELETE FROM slots
                 WHERE coordinador_id = $1
                   AND disponible = true
                   AND fecha >= $2
                   AND fecha <= $3`;
    const params = [req.user.id, fecha_inicio, fecha_fin];
    let paramIndex = 4;

    // Filtrar por horas si se proporcionan
    if (hora_inicio) {
      query += ` AND hora_inicio >= $${paramIndex++}`;
      params.push(hora_inicio);
    }
    if (hora_fin) {
      query += ` AND hora_fin <= $${paramIndex++}`;
      params.push(hora_fin);
    }

    // Filtrar por días de la semana si se proporcionan
    if (dias_semana && Array.isArray(dias_semana) && dias_semana.length > 0) {
      const diasFechas = getFechasSemana(fecha_inicio, dias_semana);
      if (diasFechas.length > 0) {
        const placeholders = diasFechas.map((_, i) => `$${paramIndex + i}`).join(', ');
        query += ` AND fecha IN (${placeholders})`;
        params.push(...diasFechas);
        paramIndex += diasFechas.length;
      }
    }

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: `${result.rowCount} slots eliminados`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/slots/eliminar-dia
 * Elimina todos los slots disponibles de una fecha específica
 */
async function eliminarDia(req, res, next) {
  try {
    const { fecha } = req.body;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    const result = await pool.query(
      `DELETE FROM slots
       WHERE coordinador_id = $1
         AND fecha = $2
         AND disponible = true`,
      [req.user.id, fecha]
    );

    return res.status(200).json({
      success: true,
      message: `${result.rowCount} slots eliminados`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/slots/regenerar-rango
 * Elimina slots existentes en el rango y genera nuevos
 */
async function regenerarRango(req, res, next) {
  try {
    const { fecha_inicio, hora_inicio, hora_fin, duracion_minutos, dias_semana } = req.body;

    // Validaciones igual que generarRango
    if (!fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio es requerida',
      });
    }

    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Las horas de inicio y fin son requeridas',
      });
    }

    if (compararHoras(hora_inicio, hora_fin) >= 0) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio debe ser anterior a la hora de fin',
      });
    }

    if (!DURACIONES_VALIDAS.includes(Number(duracion_minutos))) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser una de: 15, 20, 30, 45, 60 minutos',
      });
    }

    if (!dias_semana || !Array.isArray(dias_semana) || dias_semana.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos un día de la semana',
      });
    }

    const diasValidos = dias_semana.every((d) => d >= 1 && d <= 5);
    if (!diasValidos) {
      return res.status(400).json({
        success: false,
        message: 'Los días de la semana deben estar entre 1 (Lunes) y 5 (Viernes)',
      });
    }

    // Obtener las fechas de los días especificados
    const fechas = getFechasSemana(fecha_inicio, dias_semana);

    // 1. Eliminar slots existentes disponibles en el rango
    const placeholders = fechas.map((_, i) => `$${i + 2}`).join(', ');
    await pool.query(
      `DELETE FROM slots
       WHERE coordinador_id = $1
         AND disponible = true
         AND fecha IN (${placeholders})
         AND hora_inicio >= $${fechas.length + 2}
         AND hora_fin <= $${fechas.length + 3}`,
      [req.user.id, ...fechas, hora_inicio, hora_fin]
    );

    // 2. Generar nuevos slots
    const slotsCreados = [];
    let horaActual = hora_inicio;

    for (const fecha of fechas) {
      horaActual = hora_inicio;

      while (compararHoras(horaActual, hora_fin) < 0) {
        const horaFinSlot = sumarMinutos(horaActual, Number(duracion_minutos));

        if (compararHoras(horaFinSlot, hora_fin) > 0) {
          break;
        }

        const result = await pool.query(
          `INSERT INTO slots (fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id)
           VALUES ($1, $2, $3, $4, true, $5)
           RETURNING id, fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id`,
          [fecha, horaActual, horaFinSlot, Number(duracion_minutos), req.user.id]
        );
        slotsCreados.push(result.rows[0]);

        horaActual = horaFinSlot;
      }
    }

    return res.status(200).json({
      success: true,
      data: slotsCreados,
      message: `Rango regenerado con ${slotsCreados.length} slots`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/slots/individual
 * Crea un slot individual disponible
 */
async function agregarSlotIndividual(req, res, next) {
  try {
    const { fecha, hora_inicio, duracion_minutos } = req.body;

    // Validaciones
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    if (!hora_inicio) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio es requerida',
      });
    }

    if (!DURACIONES_VALIDAS.includes(Number(duracion_minutos))) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser una de: 15, 20, 30, 45, 60 minutos',
      });
    }

    // Calcular hora_fin
    const hora_fin = sumarMinutos(hora_inicio, Number(duracion_minutos));

    // Verificar que no exista ya un slot en la misma fecha y hora
    const existing = await pool.query(
      `SELECT id FROM slots
       WHERE coordinador_id = $1 AND fecha = $2 AND hora_inicio = $3`,
      [req.user.id, fecha, hora_inicio]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un slot en esa fecha y hora',
      });
    }

    // Crear el slot individual
    const result = await pool.query(
      `INSERT INTO slots (fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, fecha, hora_inicio, hora_fin, duracion_minutos, disponible, coordinador_id`,
      [fecha, hora_inicio, hora_fin, Number(duracion_minutos), req.user.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Slot creado',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSlotsSemana,
  generarRango,
  eliminarSlot,
  eliminarRango,
  eliminarDia,
  regenerarRango,
  agregarSlotIndividual,
};
