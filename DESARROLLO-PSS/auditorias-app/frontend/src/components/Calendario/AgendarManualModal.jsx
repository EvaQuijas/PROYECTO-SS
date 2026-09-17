import { useState } from 'react';
import { X, User, Calendar, Clock, Search } from 'lucide-react';

export default function AgendarManualModal({ slot, alumnos, onClose, onAgendar }) {
  const [alumnoId, setAlumnoId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alumnoId) {
      alert('Selecciona un alumno');
      return;
    }
    setLoading(true);
    try {
      await onAgendar({
        slot_id: slot.id,
        alumno_id: parseInt(alumnoId)
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Error al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar alumnos por nombre o email
  const alumnosFiltrados = alumnos.filter((alumno) => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(busquedaLower) ||
      alumno.email.toLowerCase().includes(busquedaLower)
    );
  });

  const fechaFormateada = slot?.fecha 
    ? new Date(slot.fecha).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border-2 border-primary-200 pointer-events-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary-900">
            Agendar cita manual
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información del slot */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary-700" />
              <span className="font-medium">Fecha:</span>
              <span>{fechaFormateada}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary-700" />
              <span className="font-medium">Hora:</span>
              <span>{slot?.hora_inicio} - {slot?.hora_fin}</span>
            </div>
          </div>

          {/* Buscador de alumnos */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" />
              Buscar alumno
            </label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe nombre o email..."
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Selector de alumnos (filtrado) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Selecciona un alumno
            </label>
            <select
              value={alumnoId}
              onChange={(e) => setAlumnoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">-- Selecciona un alumno --</option>
              {alumnosFiltrados.map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.nombre} - {alumno.email}
                </option>
              ))}
            </select>
            {alumnosFiltrados.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No se encontraron alumnos con esa búsqueda
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !alumnoId}
              className="flex-1 px-4 py-2 bg-primary-800 text-white rounded-md hover:bg-primary-900 transition disabled:opacity-50"
            >
              {loading ? 'Agendando...' : 'Agendar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}