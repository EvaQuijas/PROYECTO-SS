import { useState, useEffect } from 'react';
import { Download, Calendar, Clock, User, BookOpen, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as citaService from '../../services/citaService';

/**
 * Modal de confirmación para limpiar el historial de citas
 * (doble confirmación: el usuario debe marcar la casilla antes de confirmar)
 */
function ConfirmLimpiarHistorialModal({ total, deleting, onCancel, onConfirm }) {
  const [confirmado, setConfirmado] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 rounded-t-lg">
          <h3 className="text-lg font-semibold text-white">Limpiar historial de citas</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
            <p className="text-gray-700">
              Se eliminarán las citas con estado <strong>asistió</strong>,{' '}
              <strong>inasistencia</strong> y <strong>cancelada</strong>.
              <br />
              <span className="text-sm text-red-600 font-semibold">
                Esta acción NO se puede deshacer.
              </span>
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Total de citas a eliminar: <strong>{total}</strong>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Las citas pendientes se conservan y los slots quedarán disponibles de nuevo.
          </p>

          <label className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span>
              Confirmo que deseo eliminar las citas finalizadas del historial.
            </span>
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting || !confirmado || total === 0}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? 'Eliminando...' : 'Sí, limpiar historial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CitasList() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas'); // todas, pendiente, asistio, inasistencia, cancelada

  // Limpieza de historial
  const [showLimpiar, setShowLimpiar] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarCitas();
  }, []);

  async function cargarCitas() {
    setLoading(true);
    setError('');
    try {
      const data = await citaService.getTodas();
      setCitas(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar citas por estado
  const citasFiltradas = citas.filter((cita) => {
    if (filtro === 'todas') return true;
    return cita.estado === filtro;
  });

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (citasFiltradas.length === 0) {
      alert('No hay citas para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = citasFiltradas.map((cita) => ({
      'Alumno': cita.alumno_nombre || 'Sin nombre',
      'Email': cita.alumno_email || 'Sin email',
      'Programa': cita.programa_nombre || 'Sin programa',
      'Fecha': formatearFecha(cita.fecha),
      'Hora Inicio': cita.hora_inicio?.slice(0, 5) || '',
      'Hora Fin': cita.hora_fin?.slice(0, 5) || '',
      'Duración (min)': cita.duracion_minutos || '',
      'Estado': cita.estado || 'pendiente',
      'Agendado por': cita.agendado_por || 'alumno',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Citas');

    // Generar nombre del archivo con fecha
    const fechaActual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `citas_agendadas_${fechaActual}.xlsx`);
  };

  // Contar por estado
  const contarPorEstado = (estado) => {
    return citas.filter((c) => c.estado === estado).length;
  };

  // Citas finalizadas (las que elimina "Limpiar historial")
  const totalFinalizadas =
    contarPorEstado('asistio') +
    contarPorEstado('inasistencia') +
    contarPorEstado('cancelada');

  /**
   * Elimina del historial las citas finalizadas y recarga la lista
   */
  async function handleLimpiarHistorial() {
    setLimpiando(true);
    setError('');
    setMensaje('');
    try {
      const result = await citaService.deleteHistorial();
      setShowLimpiar(false);
      setMensaje(result?.message || 'Historial de citas eliminado correctamente');
      await cargarCitas();
    } catch (err) {
      setError(err.message);
      setShowLimpiar(false);
    } finally {
      setLimpiando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-primary-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando citas...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">Citas agendadas</h2>
          <p className="text-sm text-gray-500">
            Total: {citas.length} citas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
          </button>

          {/* 🗑️ BOTÓN LIMPIAR HISTORIAL */}
          <button
            onClick={() => {
              setMensaje('');
              setShowLimpiar(true);
            }}
            disabled={totalFinalizadas === 0}
            title={
              totalFinalizadas === 0
                ? 'No hay citas finalizadas para eliminar'
                : 'Eliminar citas finalizadas del historial'
            }
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar historial
          </button>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            filtro === 'todas'
              ? 'bg-primary-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas ({citas.length})
        </button>
        <button
          onClick={() => setFiltro('pendiente')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            filtro === 'pendiente'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Pendientes ({contarPorEstado('pendiente')})
        </button>
        <button
          onClick={() => setFiltro('asistio')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            filtro === 'asistio'
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          Asistió ({contarPorEstado('asistio')})
        </button>
        <button
          onClick={() => setFiltro('inasistencia')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            filtro === 'inasistencia'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          Inasistencia ({contarPorEstado('inasistencia')})
        </button>
        <button
          onClick={() => setFiltro('cancelada')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            filtro === 'cancelada'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          Canceladas ({contarPorEstado('cancelada')})
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Mensaje de éxito (limpieza de historial) */}
      {mensaje && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <span>{mensaje}</span>
          <button
            onClick={() => setMensaje('')}
            className="text-green-700 hover:text-green-900 font-semibold"
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabla de citas */}
      {citasFiltradas.length === 0 ? (
        <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-500">
            {filtro === 'todas'
              ? 'No hay citas agendadas'
              : `No hay citas con estado "${filtro}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    <User className="w-4 h-4 inline mr-1" />
                    Alumno
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Programa
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map((cita, idx) => (
                  <tr
                    key={cita.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {cita.alumno_nombre || 'Sin nombre'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {cita.alumno_email || 'Sin email'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: cita.programa_color || '#6b7280' }}
                      >
                        {cita.programa_nombre || 'Sin programa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatearFecha(cita.fecha)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cita.hora_inicio?.slice(0, 5)} - {cita.hora_fin?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          cita.estado === 'asistio'
                            ? 'bg-green-100 text-green-700'
                            : cita.estado === 'inasistencia'
                            ? 'bg-red-100 text-red-700'
                            : cita.estado === 'cancelada'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {cita.estado || 'pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmación de limpieza de historial */}
      {showLimpiar && (
        <ConfirmLimpiarHistorialModal
          total={totalFinalizadas}
          deleting={limpiando}
          onCancel={() => setShowLimpiar(false)}
          onConfirm={handleLimpiarHistorial}
        />
      )}
    </div>
  );
}