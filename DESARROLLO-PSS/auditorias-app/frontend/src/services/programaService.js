import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de axios para programas
const api = axios.create({
  baseURL: `${API_URL}/api/programas`,
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
 * Obtiene todos los programas del coordinador autenticado
 * @returns {Promise<Array>}
 */
async function getAll() {
  try {
    const response = await api.get('/');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener programas'));
  }
}

/**
 * Obtiene un programa por su ID
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function getById(id) {
  try {
    const response = await api.get(`/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener el programa'));
  }
}

/**
 * Crea un nuevo programa
 * @param {{nombre: string, color_hex: string}} data
 * @returns {Promise<object>}
 */
async function create(data) {
  try {
    const response = await api.post('/', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear el programa'));
  }
}

/**
 * Actualiza un programa existente
 * @param {number|string} id
 * @param {{nombre?: string, color_hex?: string, activo?: boolean}} data
 * @returns {Promise<object>}
 */
async function update(id, data) {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el programa'));
  }
}

/**
 * Cambia el estado activo (toggle) de un programa
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function toggle(id) {
  try {
    const response = await api.patch(`/${id}/toggle`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al cambiar el estado del programa'));
  }
}

/**
 * Elimina un programa
 * @param {number|string} id
 */
async function remove(id) {
  try {
    const response = await api.delete(`/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar el programa'));
  }
}

export { getAll, getById, create, update, toggle, remove };
