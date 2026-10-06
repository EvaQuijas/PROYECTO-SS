import { useState } from 'react';
import {
  CalendarDays,
  BookOpen,
  LogOut,
  GraduationCap,
  Megaphone,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CalendarioAlumno from '../components/Calendario/CalendarioAlumno';
import MisCitas from '../components/Citas/MisCitas';
import AvisosAlumno from '../components/avisos/AvisosAlumno';
import ChangePasswordModal from '../components/perfil/ChangePasswordModal';

/**
 * Página principal del alumno con navegación por pestañas
 */
export default function AlumnoDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendario');
  const [showPerfil, setShowPerfil] = useState(false);

  const tabs = [
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    { id: 'citas', label: 'Mis citas', icon: BookOpen },
    { id: 'avisos', label: 'Avisos', icon: Megaphone },
  ];

  function renderContent() {
    switch (activeTab) {
      case 'calendario':
        return <CalendarioAlumno />;
      case 'citas':
        return <MisCitas />;
      case 'avisos':
        return <AvisosAlumno />;
      default:
        return <CalendarioAlumno />;
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f8e9]">
      {/* Encabezado */}
      <header className="bg-primary-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Panel del Alumno</h1>
              <p className="text-sm text-primary-100">
                {user?.nombre}
                {user?.programa_nombre ? ` · ${user.programa_nombre}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-100">Hola, {user?.nombre}</span>
            <button
              onClick={() => setShowPerfil(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-700 text-white text-sm hover:bg-primary-800 transition"
              title="Cambiar mi contraseña"
            >
              <UserCog className="w-4 h-4" />
              Mi perfil
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-700 text-white text-sm hover:bg-primary-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navegación de pestañas */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-primary-900 text-primary-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contenido de la pestaña */}
      <main className="max-w-7xl mx-auto px-4 py-8">{renderContent()}</main>

      {/* Modal de cambio de contraseña */}
      {showPerfil && <ChangePasswordModal onClose={() => setShowPerfil(false)} />}
    </div>
  );
}
