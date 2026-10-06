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

/**
 * Solicita el enlace de recuperación de contraseña
 * @param {string} email
 * @returns {Promise<string>} mensaje del backend
 */
async function forgotPassword(email) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email,
    });
    return response.data.message;
  } catch (error) {
    const message =
      error.response?.data?.message || 'Error al solicitar la recuperación';
    throw new Error(message);
  }
}

/**
 * Establece una contraseña nueva usando el token del correo
 * @param {string} token
 * @param {string} password
 * @returns {Promise<string>} mensaje del backend
 */
async function resetPassword(token, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
      token,
      password,
    });
    return response.data.message;
  } catch (error) {
    const message =
      error.response?.data?.message || 'Error al restablecer la contraseña';
    throw new Error(message);
  }
}

/**
 * Cambia la contraseña del usuario autenticado.
 * Requiere el token JWT en localStorage (se envía en el header).
 * El backend decide la tabla (coordinadores/alumnos) según el rol del token.
 * @param {string} currentPassword - Contraseña actual del usuario
 * @param {string} newPassword - Nueva contraseña (mínimo 6 caracteres)
 * @returns {Promise<string>} mensaje del backend
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/change-password`,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data.message;
  } catch (error) {
    const message =
      error.response?.data?.message || 'Error al cambiar la contraseña';
    throw new Error(message);
  }
}

export {
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
  forgotPassword,
  resetPassword,
  changePassword,
};
