import { useState } from 'react';
import { X, CalendarRange } from 'lucide-react';

const DIAS = [
  { valor: 1, label: 'Lunes' },
  { valor: 2, label: 'Martes' },
  { valor: 3, label: 'Miércoles' },
  { valor: 4, label: 'Jueves' },
  { valor: 5, label: 'Viernes' },
];

/**
 * Modal para generar/regenerar rangos de slots
 * @param {{onClose: () => void, onGenerar: (data) => Promise<any>}} props
 */
export default function RangoForm({ onClose, onGenerar }) {
  const hoy = new Date().toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('13:00');
  const [duracion, setDuracion] = useState(20);
  const [dias, setDias] = useState([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  /**
   * Alterna la selección de un día
   */
  function toggleDia(valor) {
    setDias((prev) =>
      prev.includes(valor) ? prev.filter((d) => d !== valor) : [...prev, valor]
    );
  }

  /**
   * Maneja el envío del formulario
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (dias.length === 0) {
      setError('Selecciona al menos un día');
      return;
    }

    setError('');
    setMensaje('');
    setCargando(true);

    try {
      const data = {
        fecha_inicio: fechaInicio,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        duracion_minutos: Number(duracion),
        dias_semana: dias,
      };
      const res = await onGenerar(data);
      const count = res?.data?.length ?? 0;
      setMensaje(res?.message || `${count} slots generados`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-900 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5" />
            Generar rango de slots
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}
          {mensaje && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3">
              ✓ {mensaje}
            </div>
          )}

          {/* Fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración por slot</label>
            <select
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[15, 20, 30, 45, 60].map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </div>

          {/* Días de la semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((dia) => {
                const activo = dias.includes(dia.valor);
                return (
                  <button
                    key={dia.valor}
                    type="button"
                    onClick={() => toggleDia(dia.valor)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      activo
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {cargando ? 'Generando...' : 'Generar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

