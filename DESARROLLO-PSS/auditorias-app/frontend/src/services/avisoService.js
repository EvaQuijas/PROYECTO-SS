import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de axios para avisos
const api = axios.create({
  baseURL: `${API_URL}/api/avisos`,
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
  const errores = error.response?.data?.errors;
  if (Array.isArray(errores) && errores.length > 0) {
    return errores.join('. ');
  }
  return error.response?.data?.message || error.message || fallback;
}

/**
 * Obtiene todos los avisos del coordinador autenticado
 * @returns {Promise<Array>}
 */
async function getAll() {
  try {
    const response = await api.get('/');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener avisos'));
  }
}

/**
 * Obtiene un aviso por su ID
 * Nota: el backend no expone GET /api/avisos/:id, por lo que se resuelve
 * a partir de la lista del coordinador.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function getById(id) {
  try {
    const avisos = await getAll();
    const aviso = (avisos || []).find((a) => String(a.id) === String(id));
    if (!aviso) {
      throw new Error('Aviso no encontrado');
    }
    return aviso;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener el aviso'));
  }
}

/**
 * Crea un nuevo aviso
 * @param {{titulo: string, contenido: string, programa_id: number|null}} data
 * @returns {Promise<object>}
 */
async function create(data) {
  try {
    const response = await api.post('/', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear el aviso'));
  }
}

/**
 * Actualiza un aviso existente
 * @param {number|string} id
 * @param {{titulo?: string, contenido?: string, programa_id?: number|null}} data
 * @returns {Promise<object>}
 */
async function update(id, data) {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el aviso'));
  }
}

/**
 * Elimina un aviso
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function remove(id) {
  try {
    const response = await api.delete(`/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar el aviso'));
  }
}

/**
 * Obtiene los avisos visibles para el alumno autenticado
 * (avisos globales + avisos de su programa)
 * @returns {Promise<Array>}
 */
async function getMisAvisos() {
  try {
    const response = await api.get('/mis-avisos');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener los avisos'));
  }
}

/**
 * Elimina TODOS los avisos del coordinador autenticado
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteAll() {
  try {
    const response = await api.delete('/all');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar todos los avisos'));
  }
}

export { getAll, getById, create, update, remove, deleteAll, getMisAvisos };
