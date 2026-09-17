import { useState, useEffect, useCallback } from 'react';
import { CalendarX2, Ban, Loader2 } from 'lucide-react';
import * as citaService from '../../services/citaService';

/** Normaliza una fecha y la devuelve legible (ej: "8 de enero de 2026") */
function fechaLegible(fechaStr) {
  if (!fechaStr) return '';
  const s = String(fechaStr).includes('T') ? String(fechaStr).split('T')[0] : String(fechaStr);
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${+d} de ${meses[+m - 1]} de ${y}`;
}

/** Configuración de presentación por estado */
const ESTADO_STYLES = {
  pendiente: { label: 'Pendiente', text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  cancelada: { label: 'Cancelada', text: 'text-gray-600', bg: 'bg-gray-200', dot: 'bg-gray-400' },
  asistio: { label: 'Asistió', text: 'text-primary-800', bg: 'bg-green-100', dot: 'bg-green-600' },
  inasistencia: { label: 'Inasistencia', text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
};

/** Normaliza el estado del backend a la clave esperada en ESTADO_STYLES */
function normalizarEstado(estado) {
  if (estado === 'asistio') return 'asistio';
  if (estado === 'pendiente') return 'pendiente';
  if (estado === 'cancelada') return 'cancelada';
  return 'inasistencia';
}

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelandoId, setCancelandoId] = useState(null);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await citaService.getMisCitas();
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus citas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  async function handleCancelar(id) {
    setCancelandoId(id);
    setError('');
    try {
      await citaService.cancelar(id);
      await cargarCitas();
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la cita');
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Mis citas</h2>
        <span className="text-sm text-gray-500">
          {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-7 h-7 animate-spin text-primary-800 mb-3" />
          <p className="text-sm">Cargando tus citas...</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
          <CalendarX2 className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-600">Aún no tienes citas reservadas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f1f8e9]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {citas.map((cita) => {
                const clave = normalizarEstado(cita.estado);
                const est = ESTADO_STYLES[clave] || ESTADO_STYLES.pendiente;
                const esPendiente = cita.estado === 'pendiente';
                return (
                  <tr key={cita.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {fechaLegible(cita.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {cita.hora_inicio}
                      {cita.hora_fin ? ` - ${cita.hora_fin}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cita.programa_color || '#6b7280' }}
                        />
                        {cita.programa_nombre || 'Sin programa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${est.bg} ${est.text}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${est.dot}`} />
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {esPendiente ? (
                        <button
                          onClick={() => handleCancelar(cita.id)}
                          disabled={cancelandoId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 border border-gray-300 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {cancelandoId === cita.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
