import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Instancia de axios para slots con token automático
const api = axios.create({
  baseURL: `${API_URL}/api/slots`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extrae el mensaje de error del backend o usa un fallback
 */
function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

/**
 * Obtiene los slots de la semana de una fecha (YYYY-MM-DD)
 * @param {string} fecha
 * @returns {Promise<{data: Array, semana: {inicio: string, fin: string}}>}
 */
async function getSlotsSemana(fecha) {
  try {
    const response = await api.get('/semana', { params: { fecha } });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener slots'));
  }
}

/**
 * Genera slots en un rango
 * @param {{fecha_inicio, hora_inicio, hora_fin, duracion_minutos, dias_semana}} data
 * @returns {Promise<Array>}
 */
async function generarRango(data) {
  try {
    const response = await api.post('/rango', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al generar rango'));
  }
}

/**
 * Agrega un slot individual
 * @param {{fecha, hora_inicio, duracion_minutos}} data
 * @returns {Promise<object>}
 */
async function agregarIndividual(data) {
  try {
    const response = await api.post('/individual', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al agregar slot'));
  }
}

/**
 * Elimina un slot individual por ID
 * @param {number|string} id
 */
async function eliminarSlot(id) {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar slot'));
  }
}

/**
 * Elimina slots en un rango
 * @param {{fecha_inicio, fecha_fin, hora_inicio?, hora_fin?, dias_semana?}} data
 * @returns {Promise<object>}
 */
async function eliminarRango(data) {
  try {
    const response = await api.post('/eliminar-rango', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar rango'));
  }
}

/**
 * Elimina todos los slots de un día
 * @param {{fecha}} data
 * @returns {Promise<object>}
 */
async function eliminarDia(data) {
  try {
    const response = await api.post('/eliminar-dia', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar día'));
  }
}

/**
 * Regenera los slots de un rango (elimina y vuelve a generar)
 * @param {{fecha_inicio, hora_inicio, hora_fin, duracion_minutos, dias_semana}} data
 * @returns {Promise<object>}
 */
async function regenerarRango(data) {
  try {
    const response = await api.post('/regenerar-rango', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al regenerar rango'));
  }
}

export {
  getSlotsSemana,
  generarRango,
  agregarIndividual,
  eliminarSlot,
  eliminarRango,
  eliminarDia,
  regenerarRango,
};
