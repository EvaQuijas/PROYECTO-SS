/**
 * Tareas programadas (cron jobs)
 *
 * Se importa desde server.js para que se registren al arrancar la API.
 */
const cron = require('node-cron');
const { pool } = require('../config/database');

// =============================================
// Limpieza semanal de slots disponibles que ya pasaron
// =============================================
// Se ejecuta todos los viernes a las 23:59 (hora del servidor).
//
// REGLA ESTRICTA: solo elimina slots cuya fecha ya pasó (fecha < CURRENT_DATE)
// Y que nadie reservó (disponible = true).
//
// ¿Por qué este query? Un slot que tiene una cita asociada (aunque la cita
// esté cancelada o el alumno haya faltado) NO tiene disponible = true, por lo
// que este DELETE no lo toca y el historial de la interfaz de Citas queda
// intacto.
const SQL_LIMPIAR_SLOTS =
  'DELETE FROM slots WHERE fecha < CURRENT_DATE AND disponible = true;';

async function limpiarSlotsVencidos() {
  try {
    const result = await pool.query(SQL_LIMPIAR_SLOTS);
    console.log(
      `🧹 [cron] Limpieza semanal de slots: ${result.rowCount} slot(s) disponibles vencidos eliminados`
    );
  } catch (error) {
    // Un fallo aquí no debe tumbar el servidor
    console.error('❌ [cron] Error al limpiar slots vencidos:', error.message);
  }
}

/**
 * Registra todas las tareas programadas de la aplicación.
 */
function iniciarCronJobs() {
  // '59 23 * * 5' = minuto 59, hora 23, cualquier día del mes, cualquier mes,
  // día de la semana 5 (viernes) → viernes a las 23:59
  cron.schedule('59 23 * * 5', limpiarSlotsVencidos, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || 'America/Monterrey',
  });

  console.log('⏰ Cron jobs activos: limpieza de slots cada viernes a las 23:59');
}

module.exports = {
  iniciarCronJobs,
  limpiarSlotsVencidos,
  SQL_LIMPIAR_SLOTS,
};
