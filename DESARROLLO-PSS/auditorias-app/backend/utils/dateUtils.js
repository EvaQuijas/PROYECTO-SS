/**
 * Utilidades de manejo de fechas para el sistema de slots
 */

/**
 * Obtiene el lunes y domingo de la semana de una fecha dada
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {{lunes: string, domingo: string}}
 */
function getSemana(fecha) {
  const date = new Date(fecha + 'T00:00:00');
  const diaSemana = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

  // Calcular el lunes de la semana
  // Si es domingo (0), restamos 6 días para llegar al lunes
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diffLunes);

  // Calcular el domingo (lunes + 6 días)
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return {
    lunes: formatDate(lunes),
    domingo: formatDate(domingo),
  };
}

/**
 * Obtiene las fechas de los días especificados dentro de la semana de una fecha
 * @param {string} fecha - Fecha base en formato YYYY-MM-DD
 * @param {number[]} dias - Array de días de la semana (1=Lunes, 2=Martes, ..., 5=Viernes)
 * @returns {string[]} - Array de fechas en formato YYYY-MM-DD
 */
function getFechasSemana(fecha, dias) {
  const { lunes } = getSemana(fecha);
  const lunesDate = new Date(lunes + 'T00:00:00');
  const fechas = [];

  for (const dia of dias) {
    if (dia >= 1 && dia <= 7) {
      const fechaDia = new Date(lunesDate);
      fechaDia.setDate(lunesDate.getDate() + (dia - 1));
      fechas.push(formatDate(fechaDia));
    }
  }

  return fechas;
}

/**
 * Compara si dos fechas son el mismo día (ignorando hora)
 * @param {string|Date} fecha1 - Primera fecha
 * @param {string|Date} fecha2 - Segunda fecha
 * @returns {boolean}
 */
function esMismoDia(fecha1, fecha2) {
  const d1 = new Date(fecha1 + (typeof fecha1 === 'string' ? 'T00:00:00' : ''));
  const d2 = new Date(fecha2 + (typeof fecha2 === 'string' ? 'T00:00:00' : ''));

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formatea una fecha a YYYY-MM-DD
 * @param {Date} date - Objeto Date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Suma minutos a una hora en formato HH:MM
 * @param {string} hora - Hora en formato HH:MM
 * @param {number} minutos - Minutos a sumar
 * @returns {string} - Hora resultante en formato HH:MM
 */
function sumarMinutos(hora, minutos) {
  const [horas, mins] = hora.split(':').map(Number);
  const totalMinutos = horas * 60 + mins + minutos;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
}

/**
 * Compara dos horas en formato HH:MM
 * @param {string} hora1 - Primera hora
 * @param {string} hora2 - Segunda hora
 * @returns {number} - Negativo si hora1 < hora2, 0 si igual, positivo si hora1 > hora2
 */
function compararHoras(hora1, hora2) {
  const [h1, m1] = hora1.split(':').map(Number);
  const [h2, m2] = hora2.split(':').map(Number);
  return h1 * 60 + m1 - (h2 * 60 + m2);
}

module.exports = {
  getSemana,
  getFechasSemana,
  esMismoDia,
  formatDate,
  sumarMinutos,
  compararHoras,
};
