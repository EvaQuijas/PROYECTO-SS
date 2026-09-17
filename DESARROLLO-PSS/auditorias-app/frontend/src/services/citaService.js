import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Instancia de axios para citas con token automático
const api = axios.create({
  baseURL: `${API_URL}/api/citas`,
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
 * Obtiene todas las citas de los alumnos del coordinador
 * @returns {Promise<Array>}
 */
async function getTodas() {
  try {
    const response = await api.get('/todas');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener citas'));
  }
}

/**
 * Cancela una cita
 * @param {number|string} id
 */
async function cancelar(id) {
  try {
    const response = await api.patch(`/${id}/cancelar`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al cancelar cita'));
  }
}

/**
 * Registra asistencia de una cita
 * @param {number|string} id
 */
async function registrarAsistencia(id) {
  try {
    const response = await api.patch(`/${id}/asistencia`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al registrar asistencia'));
  }
}

/**
 * Registra inasistencia de una cita
 * @param {number|string} id
 */
async function registrarInasistencia(id) {
  try {
    const response = await api.patch(`/${id}/inasistencia`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al registrar inasistencia'));
  }
}

async function agendarManual(data) {
  try {
    const response = await api.post('/agendar-manual', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al agendar cita'));
  }
}

/**
 * El alumno reserva un slot disponible
 * @param {number|string} slot_id
 * @returns {Promise<{success: boolean, data: object, message: string}>}
 */
async function reservar(slot_id) {
  try {
    const response = await api.post('/reservar', { slot_id });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al reservar el slot'));
  }
}

/**
 * Obtiene las citas del alumno autenticado
 * @returns {Promise<Array>}
 */
async function getMisCitas() {
  try {
    const response = await api.get('/mis-citas');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener tus citas'));
  }
}

/**
 * Elimina del historial las citas finalizadas (asistio, inasistencia, cancelada)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteHistorial() {
  try {
    const response = await api.delete('/historial');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar historial de citas'));
  }
}

export {
  getTodas,
  cancelar,
  registrarAsistencia,
  registrarInasistencia,
  agendarManual,
  reservar,
  getMisCitas,
  deleteHistorial,
};
