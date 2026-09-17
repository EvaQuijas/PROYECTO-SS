import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Power, AlertTriangle, Loader2, Folder } from 'lucide-react';
import * as programaService from '../../services/programaService';
import ProgramaForm from './ProgramaForm';

/**
 * Modal de confirmación para eliminar un programa
 */
function ConfirmModal({ programa, onCancel, onConfirm, deleting }) {
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
          <h3 className="text-lg font-semibold text-white">Eliminar programa</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el programa{' '}
            <span className="font-semibold">"{programa?.nombre}"</span>?
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
 * Lista todos los programas del coordinador con CRUD
 */
export default function ProgramasList() {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [programaEditando, setProgramaEditando] = useState(null);
  const [programaEliminar, setProgramaEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Carga la lista de programas
   */
  const cargarProgramas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await programaService.getAll();
      setProgramas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProgramas();
  }, [cargarProgramas]);

  /**
   * Agrega un nuevo programa
   */
  async function handleCreate(data) {
    try {
      await programaService.create(data);
      setShowForm(false);
      setProgramaEditando(null);
      await cargarProgramas();
    } catch (err) {
      // Mostrar el error dentro del formulario (se lanza la excepción)
      throw err;
    }
  }

  /**
   * Actualiza un programa existente
   */
  async function handleUpdate(data) {
    try {
      await programaService.update(programaEditando.id, data);
      setShowForm(false);
      setProgramaEditando(null);
      await cargarProgramas();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Cambia el estado activo/inactivo de un programa
   */
  async function handleToggle(programa) {
    try {
      await programaService.toggle(programa.id);
      await cargarProgramas();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * Elimina el programa seleccionado
   */
  async function handleDelete() {
    setDeleting(true);
    try {
      await programaService.remove(programaEliminar.id);
      setProgramaEliminar(null);
      await cargarProgramas();
    } catch (err) {
      setError(err.message);
      setProgramaEliminar(null);
    } finally {
      setDeleting(false);
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-primary-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando programas...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Programas</h2>
          <p className="text-sm text-gray-500">
            Gestiona los programas de auditoría de seguimiento
          </p>
        </div>
        <button
          onClick={() => {
            setProgramaEditando(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-900 text-white text-sm font-medium hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo programa
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Lista de programas */}
      {programas.length === 0 ? (
        <div className="bg-[#f1f8e9] border-2 border-dashed border-primary-200 rounded-lg p-12 text-center">
          <Folder className="w-10 h-10 mx-auto text-primary-300 mb-3" />
          <p className="text-gray-500">No hay programas registrados aún.</p>
          <p className="text-sm text-gray-400">Haz clic en "Nuevo programa" para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programas.map((programa) => (
            <div
              key={programa.id}
              className="bg-[#f1f8e9] border border-primary-100 rounded-lg shadow-sm hover:shadow-md transition p-5"
            >
              {/* Círculo de color y nombre */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: programa.color_hex }}
                  title={programa.color_hex}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{programa.nombre}</h3>
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      programa.activo
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {programa.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 border-t border-primary-100 pt-3">
                <button
                  onClick={() => {
                    setProgramaEditando(programa);
                    setShowForm(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-primary-700 text-white hover:bg-primary-800 transition"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(programa)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition ${
                    programa.activo
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {programa.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => setProgramaEliminar(programa)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear/editar */}
      {showForm && (
        <ProgramaForm
          programa={programaEditando}
          onClose={() => {
            setShowForm(false);
            setProgramaEditando(null);
          }}
          onSave={programaEditando ? handleUpdate : handleCreate}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {programaEliminar && (
        <ConfirmModal
          programa={programaEliminar}
          deleting={deleting}
          onCancel={() => setProgramaEliminar(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

