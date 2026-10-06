/**
 * Servicio de Perfil
 * Gestiona las operaciones relacionadas con la cuenta del usuario autenticado.
 */
import axios from 'axios';
import * as authService from './authService';

// URL base de la API (misma convención que el resto de servicios)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Construye los encabezados de autorización con el token guardado
 */
function authHeaders() {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Cambia la contraseña del usuario autenticado.
 * El backend deduce la tabla (coordinadores/alumnos) a partir del rol del token.
 * @param {string} currentPassword - Contraseña actual del usuario
 * @param {string} newPassword - Nueva contraseña (mínimo 6 caracteres)
 * @returns {Promise<string>} mensaje de confirmación del backend
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/change-password`,
      { currentPassword, newPassword },
      { headers: authHeaders() }
    );
    return response.data.message;
  } catch (error) {
    const message =
      error.response?.data?.message || 'Error al cambiar la contraseña';
    throw new Error(message);
  }
}

export { changePassword };
