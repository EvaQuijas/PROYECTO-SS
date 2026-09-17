import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de axios para alumnos
const api = axios.create({
  baseURL: `${API_URL}/api/alumnos`,
});

// Interceptor: agrega el token JWT a cada petición
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
 * Extrae el mensaje de error del backend o usa un mensaje genérico
 */
function getErrorMessage(error, fallback) {
  // Prioridad: mensaje propio del endpoint, luego el genérico de axios, luego fallback
  return error.response?.data?.message || error.message || fallback;
}

/**
 * Obtiene todos los alumnos del coordinador autenticado
 * @returns {Promise<Array>}
 */
async function getAll() {
  try {
    const response = await api.get('/');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener los alumnos'));
  }
}

/**
 * Obtiene un alumno por su ID
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function getById(id) {
  try {
    const response = await api.get(`/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener el alumno'));
  }
}

/**
 * Crea un nuevo alumno
 * @param {{nombre: string, email: string, programa_id: number|string}} data
 * @returns {Promise<object>}
 */
async function create(data) {
  try {
    const response = await api.post('/', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear el alumno'));
  }
}

/**
 * Actualiza un alumno existente
 * @param {number|string} id
 * @param {{nombre?: string, email?: string, programa_id?: number|string}} data
 * @returns {Promise<object>}
 */
async function update(id, data) {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el alumno'));
  }
}

/**
 * Elimina un alumno
 * @param {number|string} id
 */
async function remove(id) {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar el alumno'));
  }
}

/**
 * Elimina TODOS los alumnos del coordinador autenticado
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteAll() {
  try {
    const response = await api.delete('/all');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar todos los alumnos'));
  }
}

/**
 * Restablece la contraseña de un alumno a la temporal (123456).
 * Se devuelve el objeto de respuesta completo para acceder a `new_password`.
 * @param {number|string} id
 * @returns {Promise<{message: string, new_password: string}>}
 */
async function resetPassword(id) {
  try {
    const response = await api.post(`/${id}/reset-password`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al restablecer la contraseña'));
  }
}

export { getAll, getById, create, update, remove, deleteAll, resetPassword };
