import { useState } from 'react';
import { X, CalendarCheck2 } from 'lucide-react';

/**
 * Da formato legible a una fecha YYYY-MM-DD
 */
function formatFechaLegible(fecha) {
  if (!fecha) return '';
  const [y, m, d] = String(fecha).split('T')[0].split('-');
  if (!y || !m || !d) return String(fecha);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${+d} de ${meses[+m - 1]} de ${y}`;
}

/**
 * Modal para que el alumno confirme la reserva de un slot disponible
 * @param {{
 *   slot: {id: number|string, fecha: string, hora_inicio: string, hora_fin: string},
 *   programa: string,
 *   onClose: () => void,
 *   onConfirmar: (slot_id: number|string) => Promise<any>
 * }} props
 */
export default function ReservarSlotModal({ slot, programa, onClose, onConfirmar }) {
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    setError('');
    setReservando(true);
    try {
      await onConfirmar(slot.id);
      // El padre se encarga de cerrar y refrescar el calendario
    } catch (err) {
      setError(err.message || 'No se pudo reservar el slot');
      setReservando(false);
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
        <div className="flex items-center justify-between px-6 py-4 bg-primary-900 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5" />
            Reservar cita
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {/* Detalles del slot */}
          <div className="bg-[#f1f8e9] border border-primary-100 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha</span>
              <span className="text-sm font-semibold text-gray-800">
                {formatFechaLegible(slot.fecha)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Hora</span>
              <span className="text-sm font-semibold text-gray-800">
                {slot.hora_inicio} - {slot.hora_fin}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Programa</span>
              <span className="text-sm font-semibold text-primary-800">
                {programa || 'Sin asignar'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Tu programa se asigna de forma automática a partir de tu perfil. ¿Confirmas la
            reserva de este horario?
          </p>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={reservando}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={reservando}
              className="px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50 transition"
            >
              {reservando ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
