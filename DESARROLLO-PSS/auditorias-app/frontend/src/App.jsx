import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CoordinadorDashboard from './pages/Coordinador/CoordinadorDashboard';
import AlumnoDashboard from './pages/AlumnoDashboard';

/**
 * Componente que protege rutas según autenticación y rol
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  // Mientras carga, mostrar nada o un spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir según el rol del usuario
    if (user.role === 'coordinador') {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === 'alumno') {
      return <Navigate to="/alumno" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Componente principal de la aplicación
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinador']}>
                <CoordinadorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumno"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <AlumnoDashboard />
              </ProtectedRoute>
            }
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
