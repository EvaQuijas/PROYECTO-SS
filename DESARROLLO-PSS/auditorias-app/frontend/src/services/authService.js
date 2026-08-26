import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Inicia sesión con email y password
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<{token: string, user: object}>}
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    const { token, user } = response.data;

    // Guardar token y user en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  } catch (error) {
    // Extraer mensaje del backend si existe
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
}

/**
 * Cierra sesión eliminando token y user de localStorage
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Retorna el token de localStorage o null
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Retorna el user de localStorage o null
 * @returns {object|null}
 */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

/**
 * Retorna true si existe un token en localStorage
 * @returns {boolean}
 */
function isAuthenticated() {
  return !!getToken();
}

export {
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
};
