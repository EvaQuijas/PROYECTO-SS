import { useState } from 'react';
import { X, CheckCircle2, XCircle, Ban, User } from 'lucide-react';

/**
 * Modal para gestionar una cita (al hacer clic en un slot ocupado)
 * @param {{
 *   cita: object,
 *   onClose: () => void,
 *   onAsistencia: (id) => Promise<any>,
 *   onInasistencia: (id) => Promise<any>,
 *   onCancelar: (id) => Promise<any>
 * }} props
 */
export default function GestionCitaModal({
  cita,
  onClose,
  onAsistencia,
  onInasistencia,
  onCancelar,
}) {
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(null);

  /**
   * Ejecuta una acción y cierra el modal si fue exitosa
   */
  async function ejecutar(accion, fn) {
    setError('');
    setCargando(accion);
    try {
      await fn(cita.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setCargando(null);
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
            <User className="w-5 h-5" />
            Gestionar cita
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

          {/* Detalles de la cita */}
          <div className="bg-[#e8f5e9] rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cita.programa_color || '#4caf50' }}
              />
              <span className="font-semibold text-gray-800">{cita.programa_nombre || 'Sin programa'}</span>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Alumno:</span> {cita.alumno_nombre}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Fecha:</span> {cita.fecha}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Hora:</span> {cita.hora_inicio} - {cita.hora_fin}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Estado:</span>{' '}
              <span className={`font-medium ${cita.estado === 'pendiente' ? 'text-amber-600' : 'text-gray-600'}`}>
                {cita.estado}
              </span>
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => ejecutar('asistencia', onAsistencia)}
              disabled={cargando !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {cargando === 'asistencia' ? 'Registrando...' : 'Registrar asistencia'}
            </button>
            <button
              onClick={() => ejecutar('inasistencia', onInasistencia)}
              disabled={cargando !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cargando === 'inasistencia' ? 'Registrando...' : 'Registrar inasistencia'}
            </button>
            <button
              onClick={() => ejecutar('cancelar', onCancelar)}
              disabled={cargando !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              {cargando === 'cancelar' ? 'Cancelando...' : 'Cancelar cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
