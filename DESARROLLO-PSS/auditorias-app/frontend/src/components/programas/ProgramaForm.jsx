import { useState } from 'react';
import { X } from 'lucide-react';
import ColorPicker from '../ui/ColorPicker';

// Expresión regular para validar color HEX (#XXXXXX)
const HEX_REGEX = /^#[0-9A-F]{6}$/i;

/**
 * Modal para crear o editar un programa
 * @param {{programa: object|null, onClose: () => void, onSave: (data: object) => void}} props
 */
export default function ProgramaForm({ programa, onClose, onSave }) {
  // Estado del formulario
  const [nombre, setNombre] = useState(programa?.nombre || '');
  const [color, setColor] = useState(programa?.color_hex || '#4caf50');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const esEdicion = !!programa;

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  function validar() {
    if (!nombre.trim()) {
      setError('El nombre del programa es requerido');
      return false;
    }

    if (!HEX_REGEX.test(color)) {
      setError('El color debe tener formato HEX válido (ej: #1976d2)');
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
        nombre: nombre.trim(),
        color_hex: color,
      });
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
            {esEdicion ? 'Editar programa' : 'Crear programa'}
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
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del programa *
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Innovación"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color del programa
            </label>
            <ColorPicker value={color} onChange={setColor} />
            <p className="mt-1 text-xs text-gray-500">
              Este color identificará al programa en el calendario.
            </p>
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
              disabled={saving}
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
