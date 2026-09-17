import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Loader2, Megaphone, AlertTriangle, Calendar } from 'lucide-react';
import * as avisoService from '../../services/avisoService';
import * as programaService from '../../services/programaService';
import AvisoForm from './AvisoForm';

/**
 * Modal de confirmación para eliminar un aviso
 */
function ConfirmModal({ aviso, onCancel, onConfirm, deleting }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 rounded-t-lg">
          <h3 className="text-lg font-semibold text-white">Eliminar aviso</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el aviso{' '}
            <span className="font-semibold">&quot;{aviso?.titulo}&quot;</span>?
            <br />
            <span className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal de confirmación para eliminar TODOS los avisos
 * (doble confirmación: el usuario debe marcar la casilla antes de confirmar)
 */
function ConfirmDeleteAllModal({ total, deleting, onCancel, onConfirm }) {
  const [confirmado, setConfirmado] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 rounded-t-lg">
          <h3 className="text-lg font-semibold text-white">Eliminar TODOS los avisos</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar <strong>TODOS</strong> los avisos?
              <br />
              <span className="text-sm text-red-600 font-semibold">
                Esta acción NO se puede deshacer.
              </span>
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Total de avisos a eliminar: <strong>{total}</strong>
          </p>

          <label className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span>
              Confirmo que deseo eliminar <strong>todos</strong> los avisos publicados.
            </span>
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting || !confirmado}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar todos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
 * Lista todos los avisos del coordinador con CRUD y filtro por programa
 */
export default function AvisosList() {
  const [avisos, setAvisos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtro por programa: 'todos' | 'global' | <programa_id>
  const [filtroPrograma, setFiltroPrograma] = useState('todos');

  // Modales
  const [showForm, setShowForm] = useState(false);
  const [avisoEditando, setAvisoEditando] = useState(null);
  const [avisoEliminar, setAvisoEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Eliminación masiva
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Solo programas activos (para el filtro y el formulario)
  const programasActivos = useMemo(
    () => (Array.isArray(programas) ? programas.filter((p) => p.activo) : []),
    [programas]
  );

  /**
   * Carga los avisos y los programas del coordinador
   */
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [avisosData, programasData] = await Promise.all([
        avisoService.getAll(),
        programaService.getAll(),
      ]);
      setAvisos(Array.isArray(avisosData) ? avisosData : []);
      setProgramas(Array.isArray(programasData) ? programasData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /**
   * Crea un nuevo aviso
   */
  async function handleCreate(data) {
    await avisoService.create(data);
    setShowForm(false);
    setAvisoEditando(null);
    await cargarDatos();
  }

  /**
   * Actualiza un aviso existente
   */
  async function handleUpdate(data) {
    await avisoService.update(avisoEditando.id, data);
    setShowForm(false);
    setAvisoEditando(null);
    await cargarDatos();
  }

  /**
   * Elimina un aviso
   */
  async function handleDelete() {
    setDeleting(true);
    try {
      await avisoService.remove(avisoEliminar.id);
      setAvisoEliminar(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  /**
   * Elimina TODOS los avisos del coordinador (desde el modal masivo)
   */
  async function handleDeleteAll() {
    setDeletingAll(true);
    setError('');
    setMensaje('');
    try {
      const result = await avisoService.deleteAll();
      setShowDeleteAll(false);
      setMensaje(result?.message || 'Avisos eliminados correctamente');
      await cargarDatos();
    } catch (err) {
      setError(err.message);
      setShowDeleteAll(false);
    } finally {
      setDeletingAll(false);
    }
  }

  /**
   * Avisos filtrados según el selector de programa
   */
  const avisosFiltrados = useMemo(() => {
    if (filtroPrograma === 'todos') return avisos;
    if (filtroPrograma === 'global') return avisos.filter((a) => a.programa_id == null);
    return avisos.filter((a) => String(a.programa_id) === String(filtroPrograma));
  }, [avisos, filtroPrograma]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-primary-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando avisos...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado / barra de acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">Avisos</h2>
          <p className="text-sm text-gray-500">
            {avisosFiltrados.length} de {avisos.length} avisos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por programa */}
          <select
            value={filtroPrograma}
            onChange={(e) => setFiltroPrograma(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Filtrar por programa"
          >
            <option value="todos">Todos</option>
            <option value="global">Global</option>
            {programasActivos.map((programa) => (
              <option key={programa.id} value={programa.id}>
                {programa.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setAvisoEditando(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo aviso
          </button>

          {/* 🗑️ BOTÓN ELIMINAR TODOS */}
          <button
            onClick={() => {
              setMensaje('');
              setShowDeleteAll(true);
            }}
            disabled={avisos.length === 0}
            title={
              avisos.length === 0 ? 'No hay avisos para eliminar' : 'Eliminar todos los avisos'
            }
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar todos
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Mensaje de éxito (eliminación masiva) */}
      {mensaje && !error && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3 flex items-center justify-between gap-3">
          <span>{mensaje}</span>
          <button
            onClick={() => setMensaje('')}
            className="text-green-700 hover:text-green-900 font-semibold"
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {/* Lista de avisos */}
      {avisosFiltrados.length === 0 ? (
        <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
          <Megaphone className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-500">
            {avisos.length === 0
              ? 'Aún no has publicado avisos. Usa "Nuevo aviso" para comenzar.'
              : 'No hay avisos que coincidan con el filtro seleccionado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisosFiltrados.map((aviso) => {
            const esGlobal = aviso.programa_id == null;
            return (
              <div
                key={aviso.id}
                className="bg-[#f1f8e9] border border-primary-100 rounded-lg shadow-sm hover:shadow-md transition p-5"
              >
                {/* Encabezado de la tarjeta: badge + acciones */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAvisoEditando(aviso);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-primary-700 text-white hover:bg-primary-800 transition"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => setAvisoEliminar(aviso)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
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

      {/* Modal de crear/editar */}
      {showForm && (
        <AvisoForm
          aviso={avisoEditando}
          programas={programasActivos}
          onClose={() => {
            setShowForm(false);
            setAvisoEditando(null);
          }}
          onSave={avisoEditando ? handleUpdate : handleCreate}
        />
      )}

      {/* Modal de confirmación de eliminación masiva */}
      {showDeleteAll && (
        <ConfirmDeleteAllModal
          total={avisos.length}
          deleting={deletingAll}
          onCancel={() => setShowDeleteAll(false)}
          onConfirm={handleDeleteAll}
        />
      )}

      {/* Modal de confirmación de eliminación individual */}
      {avisoEliminar && (
        <ConfirmModal
          aviso={avisoEliminar}
          deleting={deleting}
          onCancel={() => setAvisoEliminar(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
