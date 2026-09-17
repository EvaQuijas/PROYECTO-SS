import { useState, useEffect } from 'react';
import { Loader2, Megaphone, Calendar } from 'lucide-react';
import * as avisoService from '../../services/avisoService';

/**
 * Formatea la fecha de creación del aviso
 */
function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Lista de avisos para el alumno (SOLO LECTURA).
 * Muestra los avisos globales y los de su propio programa.
 */
export default function AvisosAlumno() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarAvisos() {
      setLoading(true);
      setError('');
      try {
        const data = await avisoService.getMisAvisos();
        setAvisos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    cargarAvisos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-primary-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando avisos...</span>
      </div>
    );
  }

  // Ordenar por fecha más reciente primero (el backend ya lo hace, por seguridad)
  const avisosOrdenados = [...avisos].sort((a, b) => {
    const fa = new Date(a.created_at).getTime() || 0;
    const fb = new Date(b.created_at).getTime() || 0;
    return fb - fa;
  });

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-primary-900">Avisos</h2>
        <p className="text-sm text-gray-500">
          {avisosOrdenados.length} {avisosOrdenados.length === 1 ? 'aviso' : 'avisos'} disponible
          {avisosOrdenados.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Lista de avisos */}
      {avisosOrdenados.length === 0 ? (
        <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
          <Megaphone className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-500">No hay avisos por el momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisosOrdenados.map((aviso) => {
            const esGlobal = aviso.programa_id == null;
            return (
              <div
                key={aviso.id}
                className="bg-[#f1f8e9] border border-primary-100 rounded-lg shadow-sm hover:shadow-md transition p-5"
              >
                {/* Badge del programa / global */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {esGlobal ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gray-500">
                      Global
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: aviso.programa_color || '#6b7280' }}
                    >
                      {aviso.programa_nombre || 'Programa'}
                    </span>
                  )}
                </div>

                {/* Título y contenido */}
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  {aviso.titulo}
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">
                  {aviso.contenido}
                </p>

                {/* Fecha */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t border-primary-100 pt-3">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatearFecha(aviso.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
