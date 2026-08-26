import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

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
 * Página de dashboard del coordinador (placeholder)
 */
function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Panel del Coordinador</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.nombre}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">
          Bienvenido al panel de coordinador. Las funcionalidades se agregarán en fases posteriores.
        </p>
      </div>
    </div>
  );
}

/**
 * Página del alumno (placeholder)
 */
function AlumnoPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Portal del Alumno</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.nombre}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">
          Bienvenido al portal del alumno. Las funcionalidades se agregarán en fases posteriores.
        </p>
      </div>
    </div>
  );
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
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumno"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <AlumnoPage />
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
