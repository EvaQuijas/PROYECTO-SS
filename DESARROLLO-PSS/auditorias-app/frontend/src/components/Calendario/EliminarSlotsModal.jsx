import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

// Modos disponibles
const MODOS = [
  { id: 'rango', label: 'Por rango' },
  { id: 'dia', label: 'Día completo' },
];

/**
 * Modal para eliminar slots (individual, por rango o día completo)
 */
export default function EliminarSlotsModal({
  slotSeleccionado,
  onClose,
  onEliminarRango,
  onEliminarDia,
}) {
  const hoy = new Date().toISOString().split('T')[0];

  const [modo, setModo] = useState('rango');
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('13:00');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  /**
   * Maneja la eliminación según el modo
   */
  async function handleEliminar() {
    setError('');
    setCargando(true);
    try {
     if (modo === 'rango') {
        await onEliminarRango({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        });
      } else {
        await onEliminarDia({ fecha: fechaInicio });
      }
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Eliminar slots
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {/* Selector de modo */}
          <div className="flex gap-2">
            {MODOS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModo(m.id)}
                className={`flex-1 px-3 py-2 rounded-md text-sm border transition ${
                  modo === m.id
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Modo por rango */}
          {modo === 'rango' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Modo día completo */}
          {modo === 'dia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha a eliminar</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              disabled={cargando}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition"
            >
              {cargando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

