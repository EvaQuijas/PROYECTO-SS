import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Lock } from 'lucide-react';
import * as slotService from '../../services/slotService';
import * as citaService from '../../services/citaService';
import { useAuth } from '../../context/AuthContext';
import ReservarSlotModal from './ReservarSlotModal';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/** Calcula el lunes de la semana de una fecha dada (YYYY-MM-DD) */
function getLunes(fechaStr) {
  const date = new Date(fechaStr + 'T00:00:00');
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diff);
  return lunes;
}

/** Convierte un Date a YYYY-MM-DD */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Suma n días a una fecha y devuelve un nuevo Date */
function sumarDias(date, n) {
  const nueva = new Date(date);
  nueva.setDate(nueva.getDate() + n);
  return nueva;
}

/** Normaliza una fecha para comparar solo el día (YYYY-MM-DD) */
function normalizarFecha(fechaStr) {
  if (!fechaStr) return '';
  return String(fechaStr).includes('T') ? String(fechaStr).split('T')[0] : String(fechaStr);
}

/** Da formato corto de día con mes, ej: "8 ene" */
function formatoDiaLabel(date) {
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${date.getDate()} ${meses[date.getMonth()]}`;
}

/**
 * Calendario semanal que el alumno SOLO puede ver (puede reservar slots disponibles).
 * No permite crear ni eliminar slots.
 */
export default function CalendarioAlumno() {
  const { user } = useAuth();
  const hoy = toDateStr(new Date());
  const [semanaBase, setSemanaBase] = useState(() => getLunes(hoy));

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de reserva
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  /** Carga los slots de la semana actual (los del coordinador del alumno) */
  const cargarSemana = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fechaLunes = toDateStr(semanaBase);
      const res = await slotService.getSlotsSemana(fechaLunes);
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los horarios disponibles');
    } finally {
      setLoading(false);
    }
  }, [semanaBase]);

  useEffect(() => {
    cargarSemana();
  }, [cargarSemana]);

  function cambiarSemana(delta) {
    setSemanaBase((anterior) => sumarDias(anterior, delta * 7));
  }

  function irAHoy() {
    setSemanaBase(getLunes(hoy));
  }

  async function confirmarReserva(slotId) {
    // El modal muestrea el error si la reserva falla; aquí lanzamos para que
    // se muestre y solo refrescamos el calendario cuando haya éxito.
    await citaService.reservar(slotId);
    setSlotSeleccionado(null);
    await cargarSemana();
  }

  const dias = DIAS_SEMANA.map((nombre, i) => {
    const fecha = sumarDias(semanaBase, i);
    return { nombre, fechaDate: fecha, fechaStr: toDateStr(fecha) };
  });

  function esOcupado(slot) {
    return Boolean(slot.cita_id) || slot.disponible === false;
  }

  return (
    <div>
      {/* Barra de navegación de semanas */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarSemana(-1)}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 px-2">
            Semana del {toDateStr(semanaBase)} al {toDateStr(sumarDias(semanaBase, 6))}
          </span>
          <button
            onClick={() => cambiarSemana(1)}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={irAHoy}
            className="px-3 py-2 rounded-md border border-primary-800 text-primary-800 text-sm hover:bg-primary-50 transition"
          >
            Hoy
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-gray-200 border border-gray-300" />
            Disponible (clic para reservar)
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-gray-500" />
            Ocupado
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-7 h-7 animate-spin text-primary-800 mb-3" />
          <p className="text-sm">Cargando horarios disponibles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {dias.map((dia) => {
            const slotsDelDia = slots
              .filter((s) => normalizarFecha(s.fecha) === dia.fechaStr)
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            const esHoy = dia.fechaStr === hoy;
            return (
              <div key={dia.fechaStr} className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
                {/* Encabezado del día */}
                <div className={`px-3 py-2 text-center ${esHoy ? 'bg-primary-900' : 'bg-[#f1f8e9]'}`}>
                  <p className={`text-sm font-semibold ${esHoy ? 'text-white' : 'text-primary-900'}`}>
                    {dia.nombre}
                  </p>
                  <p className={`text-xs ${esHoy ? 'text-primary-100' : 'text-gray-500'}`}>
                    {formatoDiaLabel(dia.fechaDate)}
                  </p>
                </div>
                {/* Slots del día */}
                <div className="p-2 space-y-2 flex-1 min-h-[140px]">
                  {slotsDelDia.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Sin horarios disponibles</p>
                  ) : (
                    slotsDelDia.map((slot) => {
                      if (esOcupado(slot)) {
                        return (
                          <div
                            key={slot.id}
                            title={`${slot.hora_inicio} - ${slot.hora_fin} (ocupado)`}
                            className="rounded-md px-2 py-2 text-white shadow-sm flex items-center gap-1.5 cursor-not-allowed"
                            style={{ backgroundColor: slot.programa_color || '#7a7a7a' }}
                          >
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[11px] leading-tight truncate">
                              {slot.hora_inicio} - {slot.programa_nombre || 'Auditoría'}
                            </span>
                          </div>
                        );
                      }
                      // Disponible → reservable
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSlotSeleccionado(slot)}
                          title={`${slot.hora_inicio} - ${slot.hora_fin} (clic para reservar)`}
                          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md px-2 py-2 text-left shadow-sm transition cursor-pointer"
                        >
                          <span className="block text-[11px] leading-tight font-medium">
                            {slot.hora_inicio} - {slot.hora_fin}
                          </span>
                          <span className="text-[10px] text-gray-500">Disponible</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de reserva */}
      {slotSeleccionado && (
        <ReservarSlotModal
          slot={slotSeleccionado}
          programa={user?.programa_nombre || ''}
          onClose={() => setSlotSeleccionado(null)}
          onConfirmar={confirmarReserva}
        />
      )}
    </div>
  );
}


