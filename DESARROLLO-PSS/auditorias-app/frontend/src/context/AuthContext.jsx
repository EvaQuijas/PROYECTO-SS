import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

// Crear el contexto
const AuthContext = createContext(null);

/**
 * Proveedor de autenticación
 * Maneja el estado del usuario y las funciones de login/logout
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar el componente, verificar si hay sesión guardada
  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (token && storedUser) {
        setUser(storedUser);
      } else if (token && !storedUser) {
        // Hay token pero no user guardado, limpiar
        authService.logout();
        setUser(null);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Inicia sesión con email y password
   */
  const login = async (email, password) => {
    const { token, user: userData } = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  /**
   * Cierra sesión
   */
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
