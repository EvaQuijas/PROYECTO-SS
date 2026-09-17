import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Trash2,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import * as slotService from '../../services/slotService';
import * as citaService from '../../services/citaService';
import RangoForm from './RangoForm';
import EliminarSlotsModal from './EliminarSlotsModal';
import GestionCitaModal from './GestionCitaModal';
import SlotIndividualForm from './SlotIndividualForm';
import AgendarManualModal from './AgendarManualModal'; // ← NUEVO IMPORT

// Nombres de los días (Lunes a Viernes)
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/**
 * Calcula el lunes de la semana de una fecha dada (YYYY-MM-DD)
 */
function getLunes(fechaStr) {
  const date = new Date(fechaStr + 'T00:00:00');
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diff);
  return lunes;
}

/**
 * Convierte un Date a YYYY-MM-DD
 */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Suma días a una fecha
 */
function sumarDias(date, n) {
  const nueva = new Date(date);
  nueva.setDate(nueva.getDate() + n);
  return nueva;
}

/**
 * Convierte hora HH:MM a minutos para ordenar
 */
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Normaliza una fecha para comparar solo el día (YYYY-MM-DD)
 */
function normalizarFecha(fechaStr) {
  if (!fechaStr) return '';
  if (fechaStr.includes('T')) {
    return fechaStr.split('T')[0];
  }
  return fechaStr;
}

/**
 * Calendario semanal del coordinador (Lunes a Viernes)
 */
export default function CalendarioCoordinador() {
  console.log('🔥🔥🔥 CalendarioCoordinador SE ESTÁ RENDERIZANDO');
  const contexto = new Date();
  const [semanaBase, setSemanaBase] = useState(getLunes(toDateStr(contexto)));

  const [slots, setSlots] = useState([]);
  const [citas, setCitas] = useState([]);
  const [alumnos, setAlumnos] = useState([]); // ← NUEVO: para el select de alumnos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modales
  const [showRango, setShowRango] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showIndividual, setShowIndividual] = useState(false);
  const [showAgendar, setShowAgendar] = useState(false); // ← NUEVO
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [slotParaEliminar, setSlotParaEliminar] = useState(null);
  const [slotParaAgendar, setSlotParaAgendar] = useState(null); // ← NUEVO

  /**
   * Carga slots y citas para la semana actual
   */
  const cargarSemana = useCallback(async () => {
    console.log('🟢 1. cargarSemana INICIO');
    setLoading(true);
    setError('');
    try {
      const fechaLunes = toDateStr(semanaBase);
      console.log('🟢 2. Fecha lunes:', fechaLunes);

      console.log('🟢 3. ANTES de slotService.getSlotsSemana');
      const slotsRes = await slotService.getSlotsSemana(fechaLunes);
      console.log('🟢 4. DESPUÉS de slotService, slotsRes:', slotsRes);

      console.log('🟢 5. ANTES de citaService.getTodas');
      const citasRes = await citaService.getTodas();
      console.log('🟢 6. DESPUÉS de citaService, citasRes:', citasRes);

      setSlots(slotsRes.data || []);
      setCitas(citasRes || []);
      console.log('🟢 7. setSlots y setCitas ejecutados');
    } catch (err) {
      console.error('🔴 ERROR en cargarSemana:', err);
      setError(err.message);
    } finally {
      console.log('🟢 8. FINALLY - loading=false');
      setLoading(false);
    }
  }, [semanaBase]);

  // Llamar a cargarSemana cuando semanaBase cambie
  useEffect(() => {
    console.log('🔄 useEffect EJECUTÁNDOSE');
    cargarSemana();
  }, [cargarSemana]);

  // Cargar alumnos para el select de agendamiento manual
  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/alumnos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setAlumnos(data.data || []);
        }
      } catch (error) {
        console.error('Error cargando alumnos:', error);
      }
    };
    cargarAlumnos();
  }, []);

  /**
   * Navega a la semana anterior o siguiente
   */
  function navegarSemana(dir) {
    setSemanaBase((prev) => sumarDias(prev, dir * 7));
  }

  /**
   * Genera un rango de slots
   */
  async function handleGenerarRango(data) {
    const res = await slotService.generarRango(data);
    setShowRango(false);
    await cargarSemana();
    return res;
  }

  /**
   * Agrega un slot individual
   */
  async function handleAgregarIndividual(data) {
    const res = await slotService.agregarIndividual(data);
    setShowIndividual(false);
    await cargarSemana();
    return res;
  }

  /**
   * Elimina un slot individual
   */
  async function handleEliminarIndividual(id) {
    const res = await slotService.eliminarSlot(id);
    setShowEliminar(false);
    setSlotParaEliminar(null);
    await cargarSemana();
    return res;
  }

  /**
   * Elimina slots por rango
   */
  async function handleEliminarRango(data) {
    const res = await slotService.eliminarRango(data);
    setShowEliminar(false);
    await cargarSemana();
    return res;
  }

  /**
   * Elimina todos los slots de un día
   */
  async function handleEliminarDia(data) {
    const res = await slotService.eliminarDia(data);
    setShowEliminar(false);
    await cargarSemana();
    return res;
  }

  /**
   * Agendar cita manualmente (coordinador)
   */
  async function handleAgendarManual(data) {
    const res = await citaService.agendarManual(data);
    setShowAgendar(false);
    setSlotParaAgendar(null);
    await cargarSemana();
    return res;
  }

  /**
   * Registra asistencia de una cita
   */
  async function handleAsistencia(id) {
    return citaService.registrarAsistencia(id);
  }

  /**
   * Registra inasistencia de una cita
   */
  async function handleInasistencia(id) {
    return citaService.registrarInasistencia(id);
  }

  /**
   * Cancela una cita
   */
  async function handleCancelarCita(id) {
    await citaService.cancelar(id);
    await cargarSemana();
  }

  // Construir fechas de Lunes a Viernes
  const fechas = Array.from({ length: 5 }, (_, i) => sumarDias(semanaBase, i));

  // Indexar citas por slot_id para combinarlas con los slots
  const citasPorSlot = {};
  citas.forEach((c) => {
    citasPorSlot[c.slot_id] = c;
  });

  // Ordenar slots por hora dentro de cada día
  const slotsPorDia = fechas.map((fecha) => {
    const fStr = toDateStr(fecha);
    const delDia = slots.filter((s) => normalizarFecha(s.fecha) === fStr);
    return delDia.sort((a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio));
  });

  // Rango de horas ocupadas para calcular la altura del grid
  let horaMin = 24 * 60;
  let horaMax = 0;
  slots.forEach((s) => {
    const ini = horaAMinutos(s.hora_inicio);
    const fin = horaAMinutos(s.hora_fin);
    if (ini < horaMin) horaMin = ini;
    if (fin > horaMax) horaMax = fin;
  });
  if (horaMax <= horaMin) {
    horaMin = 8 * 60;
    horaMax = 13 * 60;
  }
  const totalMinutos = horaMax - horaMin || 1;

  // Marcas de horas del eje vertical
  const marcas = [];
  for (let h = Math.floor(horaMin / 60); h <= Math.ceil(horaMax / 60); h++) {
    marcas.push(h);
  }

  console.log('📊 slotsPorDia:', slotsPorDia);
  console.log('📊 marcas:', marcas);
  console.log('📊 horaMin:', horaMin, 'horaMax:', horaMax);

  return (
    <div>
      {/* Barra de herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegarSemana(-1)}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium text-gray-700">
            {toDateStr(semanaBase)} — {toDateStr(sumarDias(semanaBase, 4))}
          </div>
          <button
            onClick={() => navegarSemana(1)}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRango(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-900 text-white text-sm font-medium hover:bg-primary-700 transition"
          >
            <CalendarRange className="w-4 h-4" />
            Generar rango
          </button>
          <button
            onClick={() => setShowIndividual(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Agregar slot
          </button>
          <button
            onClick={() => setShowEliminar(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar slots
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-primary-700">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando calendario...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Encabezado del grid */}
          <div className="grid" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
            <div className="bg-primary-900 text-white px-3 py-2 text-sm font-semibold">Hora</div>
            {fechas.map((fecha, idx) => (
              <div
                key={idx}
                className="bg-primary-900 text-white text-center px-3 py-2 border-l border-primary-700"
              >
                <div className="text-sm font-semibold">{DIAS_SEMANA[idx]}</div>
                <div className="text-xs text-primary-100">
                  {fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>

          {/* Cuerpo del grid */}
          <div className="grid" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
            {/* Columna de horas */}
            <div className="border-t border-gray-200 relative min-h-[480px]">
              {marcas.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100 text-xs text-gray-400 px-2 pt-0.5"
                  style={{ top: `${((h * 60 - horaMin) / totalMinutos) * 100}%` }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Columnas de los días */}
            {slotsPorDia.map((slotsDia, diaIdx) => (
              <div key={diaIdx} className="border-t border-l border-gray-200 relative min-h-[480px]">
                {slotsDia.map((slot) => {
                  const cita = citasPorSlot[slot.id];
                  const alturaPct = (slot.duracion_minutos / totalMinutos) * 100;
                  const topPct = ((horaAMinutos(slot.hora_inicio) - horaMin) / totalMinutos) * 100;

                  // Slot ocupado con cita → abre el modal de gestión
                  if (!slot.disponible && cita) {
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setCitaSeleccionada(cita)}
                        className="absolute left-1 right-1 rounded-md px-1 py-1 text-left text-white hover:brightness-110 hover:scale-[1.02] transition shadow"
                        style={{
                          top: `${topPct}%`,
                          height: `${alturaPct}%`,
                          backgroundColor: cita.programa_color || '#2e7d32',
                        }}
                        title={`${slot.hora_inicio} - ${slot.hora_fin}`}
                      >
                        <span className="block text-[11px] leading-tight font-semibold">
                          {slot.hora_inicio}
                        </span>
                        <span className="block text-[11px] leading-tight truncate">
                          {cita.alumno_nombre}
                        </span>
                      </button>
                    );
                  }

                  // Slot disponible → abre modal para AGENDAR MANUALMENTE
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSlotParaAgendar(slot);
                        setShowAgendar(true);
                      }}
                      className="absolute left-1 right-1 rounded-md border border-primary-500 bg-[#e8f5e9] text-primary-800 hover:shadow-md hover:scale-[1.02] transition shadow-sm"
                      style={{ top: `${topPct}%`, height: `${alturaPct}%` }}
                      title={`${slot.hora_inicio} - ${slot.hora_fin}`}
                    >
                      <span className="block text-[11px] leading-tight px-1 pt-1 font-medium text-primary-900">
                        {slot.hora_inicio} - {slot.hora_fin}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
      {showRango && (
        <RangoForm onClose={() => setShowRango(false)} onGenerar={handleGenerarRango} />
      )}

      {showIndividual && (
        <SlotIndividualForm
          onClose={() => setShowIndividual(false)}
          onAgregar={handleAgregarIndividual}
        />
      )}

      {showEliminar && (
        <EliminarSlotsModal
          slotSeleccionado={slotParaEliminar}
          onClose={() => {
            setShowEliminar(false);
            setSlotParaEliminar(null);
          }}
          onEliminarIndividual={handleEliminarIndividual}
          onEliminarRango={handleEliminarRango}
          onEliminarDia={handleEliminarDia}
        />
      )}

      {/* NUEVO: Modal para agendar manualmente */}
      {showAgendar && slotParaAgendar && (
        <AgendarManualModal
          slot={slotParaAgendar}
          alumnos={alumnos}
          onClose={() => {
            setShowAgendar(false);
            setSlotParaAgendar(null);
          }}
          onAgendar={handleAgendarManual}
        />
      )}

      {citaSeleccionada && (
        <GestionCitaModal
          cita={citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onAsistencia={handleAsistencia}
          onInasistencia={handleInasistencia}
          onCancelar={handleCancelarCita}
        />
      )}
    </div>
  );
}