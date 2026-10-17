import { useState, useEffect } from 'react';
import { Download, Calendar, Clock, User, BookOpen, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as citaService from '../../services/citaService';

export default function CitasList() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas'); // todas, pendiente, asistio, inasistencia, cancelada

  // Estados para el rango de fechas del Excel
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

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

  // 1. Filtrar por estado (botones)
  const citasFiltradasPorEstado = citas.filter((cita) => {
    if (filtro === 'todas') return true;
    return cita.estado === filtro;
  });

  // 2. Filtrar por rango de fechas (para la tabla y el Excel)
  const citasFiltradasFinal = citasFiltradasPorEstado.filter((cita) => {
    if (!fechaInicio && !fechaFin) return true;
    
    // Normalizar la fecha de la cita a YYYY-MM-DD
    const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
    
    if (fechaInicio && fechaCita < fechaInicio) return false;
    if (fechaFin && fechaCita > fechaFin) return false;
    
    return true;
  });

  // Exportar a Excel
  const exportarExcel = () => {
    if (citasFiltradasFinal.length === 0) {
      alert('No hay citas para exportar en ese rango de fechas');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = citasFiltradasFinal.map((cita) => ({
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

    // Generar nombre del archivo
    const fechaActual = new Date().toISOString().split('T')[0];
    const nombreArchivo = `citas_${fechaInicio || 'inicio'}_${fechaFin || 'fin'}_${fechaActual}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Contar por estado (para los botones)
  const contarPorEstado = (estado) => {
    return citas.filter((c) => c.estado === estado).length;
  };

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
      {/* Encabezado y Herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">Citas agendadas</h2>
          <p className="text-sm text-gray-500">
            Mostrando: {citasFiltradasFinal.length} citas
          </p>
        </div>

        {/* Controles de Exportación */}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition h-[38px]"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
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

      {/* Tabla de citas */}
      {citasFiltradasFinal.length === 0 ? (
        <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-500">
            No hay citas que coincidan con los filtros seleccionados.
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
                {citasFiltradasFinal.map((cita, idx) => (
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
    </div>
  );
}