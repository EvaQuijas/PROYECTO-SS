import { useState } from 'react';
import { X } from 'lucide-react';

// Expresión regular para validar un email simple
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal para crear o editar un alumno
 * @param {{
 *   alumno: object|null,
 *   programas: Array<{id: number|string, nombre: string}>,
 *   onClose: () => void,
 *   onSave: (data: {nombre: string, email: string, programa_id: number|string}) => void
 * }} props
 */
export default function AlumnoForm({ alumno, programas, onClose, onSave }) {
  // Estado del formulario
  const [nombre, setNombre] = useState(alumno?.nombre || '');
  const [email, setEmail] = useState(alumno?.email || '');
  const [programaId, setProgramaId] = useState(alumno?.programa_id ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const esEdicion = !!alumno;

  // Lista de programas activos para el select
  const programasActivos = Array.isArray(programas) ? programas.filter((p) => p.activo !== false) : [];

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  function validar() {
    if (!nombre.trim()) {
      setError('El nombre del alumno es requerido');
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ingresa un email válido');
      return false;
    }
    if (!programaId) {
      setError('Selecciona un programa');
      return false;
    }
    setError('');
    return true;
  }

  /**
   * Maneja el envío del formulario
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validar()) return;

    setSaving(true);
    setError('');
    try {
      await onSave({
        nombre: nombre.trim(),
        email: email.trim(),
        programa_id: programaId,
      });
    } catch (err) {
      // Mostrar el error (p. ej. email duplicado) dentro del formulario
      setError(err.message || 'No se pudo guardar el alumno');
    } finally {
      setSaving(false);
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
          <h2 className="text-lg font-semibold text-white">
            {esEdicion ? 'Editar alumno' : 'Nuevo alumno'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label htmlFor="alumno-nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id="alumno-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ana García"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="alumno-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="alumno-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: ana@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Programa */}
          <div>
            <label htmlFor="alumno-programa" className="block text-sm font-medium text-gray-700 mb-1">
              Programa *
            </label>
            <select
              id="alumno-programa"
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                programaId ? 'border-gray-300' : 'border-gray-300 text-gray-500'
              }`}
            >
              <option value="" disabled>
                Selecciona un programa
              </option>
              {programasActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            {programasActivos.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No hay programas activos disponibles.
              </p>
            )}
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
              disabled={saving || programasActivos.length === 0}
              className="px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
