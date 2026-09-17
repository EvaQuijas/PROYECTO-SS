import { useState } from 'react';
import {
  Folder,
  CalendarDays,
  Users,
  BookOpen,
  LogOut,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProgramasList from '../../components/programas/ProgramasList';
import CalendarioCoordinador from '../../components/Calendario/CalendarioCoordinador';
import AlumnosList from '../../components/alumnos/AlumnosList';
import CitasList from '../../components/Citas/CitasList';
import AvisosList from '../../components/avisos/AvisosList';
import CoordinadoresList from '../../components/coordinadores/CoordinadoresList';

/**
 * Página principal del coordinador con navegación por pestañas
 */
export default function CoordinadorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendario');

  // Solo el coordinador principal puede administrar otros coordinadores
  const esPrincipal = user?.es_principal === true;

  // Definición de las pestañas disponibles
  const tabs = [
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    { id: 'programas', label: 'Programas', icon: Folder },
    { id: 'alumnos', label: 'Alumnos', icon: Users },
    { id: 'citas', label: 'Citas', icon: BookOpen },
    { id: 'avisos', label: 'Avisos', icon: Megaphone },
    // Pestaña exclusiva del coordinador principal
    ...(esPrincipal
      ? [{ id: 'coordinadores', label: 'Coordinadores', icon: ShieldCheck }]
      : []),
  ];

  /**
   * Renderiza el contenido según la pestaña activa
   */
  function renderContent() {
    switch (activeTab) {

      case 'calendario':
        return <CalendarioCoordinador />;
      case 'programas':
        return <ProgramasList />;
      case 'alumnos':
        return <AlumnosList />;
      case 'citas':
        return <CitasList />;
      case 'avisos':
        return <AvisosList />;
      case 'coordinadores':
        return esPrincipal ? <CoordinadoresList /> : null;
      default:
        return (
          <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
            <LayoutDashboard className="w-10 h-10 mx-auto text-primary-300 mb-3" />
            <p className="text-gray-500">
              Esta sección se habilitará en próximas fases del proyecto.
            </p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f8e9]">
      {/* Encabezado */}
      <header className="bg-primary-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Panel del Coordinador</h1>
              <p className="text-sm text-primary-100">
                Sistema de Gestión de Auditorías de Seguimiento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-100 flex items-center gap-2">
              Hola, {user?.nombre}
              {esPrincipal && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-500 text-white">
                  Principal
                </span>
              )}
            </span>
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
    </div>
  );
}
