import { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

/**
 * Modal para crear o editar un aviso
 * @param {{
 *   aviso: object|null,
 *   programas: Array<{id: number|string, nombre: string, color_hex?: string}>,
 *   onClose: () => void,
 *   onSave: (data: {titulo: string, contenido: string, programa_id: number|null}) => Promise<void>
 * }} props
 */
export default function AvisoForm({ aviso, programas, onClose, onSave }) {
  // Estado del formulario
  const [titulo, setTitulo] = useState(aviso?.titulo || '');
  const [contenido, setContenido] = useState(aviso?.contenido || '');
  // '' representa aviso global (programa_id = null)
  const [programaId, setProgramaId] = useState(
    aviso?.programa_id != null ? String(aviso.programa_id) : ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const esEdicion = !!aviso;

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  function validar() {
    if (!titulo.trim()) {
      setError('El título del aviso es requerido');
      return false;
    }

    if (titulo.trim().length > 200) {
      setError('El título no puede exceder 200 caracteres');
      return false;
    }

    if (!contenido.trim()) {
      setError('El contenido del aviso es requerido');
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
    try {
      await onSave({
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        // '' = aviso global (programa_id = null)
        programa_id: programaId === '' ? null : Number(programaId),
      });
    } catch (err) {
      // Mostrar el error dentro del formulario
      setError(err.message || 'No se pudo guardar el aviso');
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
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-900 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {esEdicion ? 'Editar aviso' : 'Nuevo aviso'}
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

          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Suspensión de actividades"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Contenido */}
          <div>
            <label htmlFor="contenido" className="block text-sm font-medium text-gray-700 mb-1">
              Contenido *
            </label>
            <textarea
              id="contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={5}
              placeholder="Escribe el mensaje del aviso..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Programa destino */}
          <div>
            <label htmlFor="programa" className="block text-sm font-medium text-gray-700 mb-1">
              Programa destino
            </label>
            <select
              id="programa"
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los programas (Global)</option>
              {(programas || []).map((programa) => (
                <option key={programa.id} value={programa.id}>
                  {programa.nombre}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Si seleccionas &quot;Todos los programas&quot;, el aviso será global.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50 transition"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
