import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de axios para coordinadores
const api = axios.create({
  baseURL: `${API_URL}/api/coordinadores`,
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
  return error.response?.data?.message || error.message || fallback;
}

/**
 * Obtiene todos los coordinadores registrados
 * Solo disponible para el coordinador principal
 * @returns {Promise<Array>}
 */
async function getAll() {
  try {
    const response = await api.get('/');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener coordinadores'));
  }
}

/**
 * Crea un nuevo coordinador con contraseña temporal
 * @param {{nombre: string, email: string, password?: string}} data
 * @returns {Promise<{data: object, message: string, password_temporal: string}>}
 */
async function create(data) {
  try {
    const response = await api.post('/', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear el coordinador'));
  }
}

/**
 * Activa o desactiva un coordinador
 * @param {number|string} id
 * @returns {Promise<{data: object, message: string}>}
 */
async function toggleActivo(id) {
  try {
    const response = await api.patch(`/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al cambiar el estado del coordinador'));
  }
}

/**
 * Restablece la contraseña de un coordinador a la temporal (123456)
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

/**
 * Elimina un coordinador
 * @param {number|string} id
 * @returns {Promise<{message: string}>}
 */
async function remove(id) {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar el coordinador'));
  }
}

export { getAll, create, toggleActivo, resetPassword, remove };
