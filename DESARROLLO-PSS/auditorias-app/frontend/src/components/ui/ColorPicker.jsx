import { Circle } from 'lucide-react';

/**
 * Selector de color con vista previa
 * @param {{value: string, onChange: (value: string) => void}} props
 */
export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      {/* Vista previa del color seleccionado */}
      <div
        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center shadow-sm"
        style={{ backgroundColor: value || '#4caf50' }}
      >
        <Circle className="w-5 h-5 text-white/70" />
      </div>

      {/* Input de color */}
      <input
        type="color"
        value={value || '#4caf50'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-14 h-10 cursor-pointer rounded border border-gray-300 bg-white p-1"
        aria-label="Seleccionar color"
      />

      {/* Muestra el valor HEX actual */}
      <input
        type="text"
        value={value || '#4caf50'}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-32 uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="#XXXXXX"
      />
    </div>
  );
}
