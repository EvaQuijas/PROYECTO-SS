import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Power,
  KeyRound,
  AlertTriangle,
  Loader2,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react';
import * as coordinadorService from '../../services/coordinadorService';
import CoordinadorForm from './CoordinadorForm';
import ResetPasswordModal from './ResetPasswordModal';

/**
 * Formatea una fecha ISO a un texto legible en español
 */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Badge que indica si el coordinador es el principal
 */
function BadgePrincipal() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-900 text-white">
      Principal
    </span>
  );
}

/**
 * Badge de estado activo/inactivo
 */
function BadgeActivo({ activo }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}


/**
 * Modal de confirmación para eliminar un coordinador
 */
function ConfirmDeleteModal({ coordinador, onCancel, onConfirm, deleting }) {
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
          <h3 className="text-lg font-semibold text-white">Eliminar coordinador</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar al coordinador{' '}
            <span className="font-semibold">"{coordinador?.nombre}"</span>?
            <br />
            <span className="text-sm text-gray-500">
              Se eliminarán también sus programas, alumnos, horarios, citas y avisos.
              Esta acción no se puede deshacer.
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50 transition"
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
 * Modal de confirmación para activar/desactivar un coordinador
 */
function ConfirmToggleModal({ coordinador, onCancel, onConfirm, saving }) {
  const vaAActivar = !coordinador?.activo;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 rounded-t-lg ${
            vaAActivar ? 'bg-primary-900' : 'bg-amber-500'
          }`}
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Power className="w-5 h-5" />
            {vaAActivar ? 'Activar coordinador' : 'Desactivar coordinador'}
          </h3>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700">
            ¿Seguro que deseas {vaAActivar ? 'activar' : 'desactivar'} a{' '}
            <span className="font-semibold">"{coordinador?.nombre}"</span>?
            <br />
            <span className="text-sm text-gray-500">
              {vaAActivar
                ? 'El coordinador podrá volver a iniciar sesión en el sistema.'
                : 'El coordinador no podrá iniciar sesión, pero sus datos se conservarán.'}
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className={`px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 transition ${
                vaAActivar
                  ? 'bg-primary-800 hover:bg-primary-900'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {saving ? 'Procesando...' : vaAActivar ? 'Sí, activar' : 'Sí, desactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lista de coordinadores registrados (solo visible para el coordinador principal).
 * Permite crear, activar/desactivar, resetear contraseña y eliminar coordinadores.
 */
export default function CoordinadoresList() {
  const [coordinadores, setCoordinadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [coordinadorToggle, setCoordinadorToggle] = useState(null);
  const [coordinadorEliminar, setCoordinadorEliminar] = useState(null);
  const [coordinadorReset, setCoordinadorReset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Carga la lista de coordinadores
   */
  const cargarCoordinadores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coordinadorService.getAll();
      setCoordinadores(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCoordinadores();
  }, [cargarCoordinadores]);

  /**
   * Crea un nuevo coordinador y devuelve la contraseña temporal
   */
  async function handleCreate(data) {
    const result = await coordinadorService.create(data);
    setShowForm(false);
    setMensaje(result.message || 'Coordinador creado exitosamente');
    await cargarCoordinadores();
    return result.password_temporal;
  }

  /**
   * Confirma el cambio de estado activo/inactivo
   */
  async function handleToggleConfirm() {
    setSaving(true);
    setError('');
    setMensaje('');
    try {
      const result = await coordinadorService.toggleActivo(coordinadorToggle.id);
      setMensaje(result.message || 'Estado actualizado correctamente');
      setCoordinadorToggle(null);
      await cargarCoordinadores();
    } catch (err) {
      setError(err.message);
      setCoordinadorToggle(null);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Elimina un coordinador
   */
  async function handleDelete() {
    setDeleting(true);
    setError('');
    setMensaje('');
    try {
      const result = await coordinadorService.remove(coordinadorEliminar.id);
      setMensaje(result.message || 'Coordinador eliminado correctamente');
      setCoordinadorEliminar(null);
      await cargarCoordinadores();
    } catch (err) {
      setError(err.message);
      setCoordinadorEliminar(null);
    } finally {
      setDeleting(false);
    }
  }

  /**
   * Resetea la contraseña y devuelve la nueva (temporal)
   */
  async function handleReset(coordinador) {
    const result = await coordinadorService.resetPassword(coordinador.id);
    setMensaje(result.message || 'Contraseña restablecida correctamente');
    await cargarCoordinadores();
    return result.new_password || '123456';
  }

  /**
   * Indica si un coordinador es el usuario actual (no se puede auto-gestionar)
   */
  function esYo(coordinador) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && Number(user.id) === Number(coordinador.id);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-900" />
            Coordinadores
          </h2>
          <p className="text-sm text-gray-500">
            Administra las cuentas de coordinadores del sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setMensaje('');
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo coordinador
        </button>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900 font-semibold"
              aria-label="Cerrar error"
            >
              ×
            </button>
          </div>
        )}

        {mensaje && !error && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {mensaje}
            </span>
            <button
              onClick={() => setMensaje('')}
              className="text-green-700 hover:text-green-900 font-semibold"
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando coordinadores...
          </div>
        ) : coordinadores.length === 0 ? (
          <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-primary-300 mb-3" />
            <p className="text-gray-500">No hay coordinadores registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-3 pr-4 font-medium">Nombre</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Principal</th>
                  <th className="py-3 pr-4 font-medium">Activo</th>
                  <th className="py-3 pr-4 font-medium">Fecha de registro</th>
                  <th className="py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coordinadores.map((c) => {
                  const esPrincipal = c.es_principal === true;
                  const esUsuarioActual = esYo(c);
                  const bloqueado = esPrincipal || esUsuarioActual;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-[#f1f8e9] transition"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {c.nombre}
                        {esUsuarioActual && (
                          <span className="ml-2 text-xs text-gray-400">(tú)</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{c.email}</td>
                      <td className="py-3 pr-4">
                        {esPrincipal ? (
                          <BadgePrincipal />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <BadgeActivo activo={c.activo} />
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatearFecha(c.created_at)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setMensaje('');
                              setCoordinadorToggle(c);
                            }}
                            disabled={bloqueado}
                            title={
                              bloqueado
                                ? 'No puedes cambiar tu propio estado ni el del coordinador principal'
                                : c.activo
                                ? 'Desactivar coordinador'
                                : 'Activar coordinador'
                            }
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Power className="w-3.5 h-3.5" />
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            onClick={() => {
                              setMensaje('');
                              setCoordinadorReset(c);
                            }}
                            disabled={esUsuarioActual}
                            title={
                              esUsuarioActual
                                ? 'No puedes restablecer tu propia contraseña desde aquí'
                                : 'Resetear contraseña'
                            }
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Resetear contraseña
                          </button>

                          <button
                            onClick={() => {
                              setMensaje('');
                              setCoordinadorEliminar(c);
                            }}
                            disabled={bloqueado}
                            title={
                              bloqueado
                                ? 'No puedes eliminarte a ti mismo ni al coordinador principal'
                                : 'Eliminar coordinador'
                            }
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CoordinadorForm onClose={() => setShowForm(false)} onSave={handleCreate} />
      )}

      {coordinadorToggle && (
        <ConfirmToggleModal
          coordinador={coordinadorToggle}
          saving={saving}
          onCancel={() => setCoordinadorToggle(null)}
          onConfirm={handleToggleConfirm}
        />
      )}

      {coordinadorReset && (
        <ResetPasswordModal
          coordinador={coordinadorReset}
          onReset={handleReset}
          onClose={() => setCoordinadorReset(null)}
        />
      )}

      {coordinadorEliminar && (
        <ConfirmDeleteModal
          coordinador={coordinadorEliminar}
          deleting={deleting}
          onCancel={() => setCoordinadorEliminar(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

