import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Loader2,
  Search,
  Users,
  AlertTriangle,
  User,
} from 'lucide-react';
import * as alumnoService from '../../services/alumnoService';
import * as programaService from '../../services/programaService';
import AlumnoForm from './AlumnoForm';
import ResetPasswordModal from './ResetPasswordModal';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

const PAGE_SIZE = 10;

/**
 * Modal interno de confirmación para eliminar un alumno
 */
function ConfirmDeleteModal({ alumno, deleting, onCancel, onConfirm }) {
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
          <h3 className="text-lg font-semibold text-white">Eliminar alumno</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-semibold">"{alumno?.nombre}"</span>?
            <br />
            <span className="text-sm text-gray-500">Esta acción no se puede deshacer.</span>
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
 * Modal de confirmación para eliminar TODOS los alumnos (doble confirmación:
 * el usuario debe marcar la casilla antes de poder confirmar)
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
          <h3 className="text-lg font-semibold text-white">Eliminar TODOS los alumnos</h3>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar <strong>TODOS</strong> los alumnos?
              <br />
              <span className="text-sm text-red-600 font-semibold">
                Esta acción NO se puede deshacer.
              </span>
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Total de alumnos a eliminar: <strong>{total}</strong>
          </p>

          <label className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span>
              Confirmo que deseo eliminar <strong>todos</strong> los alumnos y sus citas asociadas.
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
 * Formatea la fecha de registro (created_at)
 */
function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Lista todos los alumnos del coordinador con CRUD, búsqueda y filtro
 */
export default function AlumnosList() {
  const [alumnos, setAlumnos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState('');

  // Modales
  const [showForm, setShowForm] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [alumnoEliminar, setAlumnoEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [alumnoReset, setAlumnoReset] = useState(null);

  // Eliminación masiva
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Paginación
  const [pagina, setPagina] = useState(1);

  // Solo programas activos (para filtro y formulario)
  const programasActivos = useMemo(
    () => (Array.isArray(programas) ? programas.filter((p) => p.activo !== false) : []),
    [programas]
  );

  /**
   * Carga todos los alumnos
   */
  const cargarAlumnos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alumnoService.getAll();
      setAlumnos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga los programas disponibles del coordinador
   */
  const cargarProgramas = useCallback(async () => {
    try {
      const data = await programaService.getAll();
      setProgramas(data || []);
    } catch {
      // No bloqueamos la lista si fallan los programas; solo el filtro/select
      setProgramas([]);
    }
  }, []);


  useEffect(() => {
    cargarAlumnos();
    cargarProgramas();
  }, [cargarAlumnos, cargarProgramas]);

  // Exportar a Excel
const exportarExcel = () => {
  if (filtrados.length === 0) {
    alert('No hay alumnos para exportar');
    return;
  }

  // Preparar datos para Excel
  const datosExcel = filtrados.map((alumno) => ({
    'Nombre': alumno.nombre || 'Sin nombre',
    'Email': alumno.email || 'Sin email',
    'Programa': alumno.programa_nombre || 'Sin programa',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);
  XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

  // Generar nombre del archivo con fecha
  const fechaActual = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `alumnos_${fechaActual}.xlsx`);
};

  /**
   * Crea un nuevo alumno
   */
  async function handleCreate(data) {
    try {
      await alumnoService.create(data);
      setShowForm(false);
      setAlumnoEditando(null);
      await cargarAlumnos();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Actualiza un alumno existente
   */
  async function handleUpdate(data) {
    try {
      await alumnoService.update(alumnoEditando.id, data);
      setShowForm(false);
      setAlumnoEditando(null);
      await cargarAlumnos();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Elimina un alumno (llamado desde el modal de confirmación)
   */
  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await alumnoService.remove(alumnoEliminar.id);
      setAlumnoEliminar(null);
      await cargarAlumnos();
    } catch (err) {
      setError(err.message);
      setAlumnoEliminar(null);
    } finally {
      setDeleting(false);
    }
  }

  /**
   * Elimina TODOS los alumnos del coordinador (desde el modal masivo)
   */
  async function handleDeleteAll() {
    setDeletingAll(true);
    setError('');
    setMensaje('');
    try {
      const result = await alumnoService.deleteAll();
      setShowDeleteAll(false);
      setMensaje(result?.message || 'Alumnos eliminados correctamente');
      await cargarAlumnos();
    } catch (err) {
      setError(err.message);
      setShowDeleteAll(false);
    } finally {
      setDeletingAll(false);
    }
  }

  /**
   * Resetea la contraseña de un alumno.
   * Devuelve la nueva contraseña para que el modal la muestre.
   */
  async function handleReset(alumno) {
    const result = await alumnoService.resetPassword(alumno.id);
    return result?.new_password || result?.data?.new_password;
  }

  /**
   * Filtra los alumnos por búsqueda (nombre/email) y por programa
   */
  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const result = alumnos.filter((a) => {
      if (term) {
        const nombre = (a.nombre || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        if (!nombre.includes(term) && !email.includes(term)) return false;
      }
      if (filtroPrograma && String(a.programa_id) !== String(filtroPrograma)) return false;
      return true;
    });
    // Ordenar alfabéticamente por nombre como garantía
    return result.slice().sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  }, [alumnos, busqueda, filtroPrograma]);

  // Datos paginados
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = useMemo(
    () => filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE),
    [filtrados, paginaActual]
  );

  // Reiniciar a página 1 cuando cambian filtros
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroPrograma]);

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Alumnos
        </h2>

         {/* ✅ BOTÓN EXPORTAR A EXCEL */}
    <div className="flex flex-wrap items-center gap-2">
    <button
      onClick={exportarExcel}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition"
    >
      <Download className="w-4 h-4" />
      Exportar a Excel
    </button>

        {/* 🗑️ BOTÓN ELIMINAR TODOS */}
        <button
          onClick={() => {
            setMensaje('');
            setShowDeleteAll(true);
          }}
          disabled={alumnos.length === 0}
          title={
            alumnos.length === 0
              ? 'No hay alumnos para eliminar'
              : 'Eliminar todos los alumnos'
          }
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar todos
        </button>
    
        <button
          onClick={() => {
            setAlumnoEditando(null);
            setShowForm(true);
          }}

          
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo alumno
        </button>
        </div>
      </div>
      

      

      {/* Error global */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Mensaje de éxito (eliminación masiva) */}
      {mensaje && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3 mb-4 flex items-center justify-between gap-3">
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

      {/* Barra de búsqueda y filtro */}
      <div className="bg-[#f1f8e9] border border-primary-100 rounded-lg p-3 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filtroPrograma}
          onChange={(e) => setFiltroPrograma(e.target.value)}
          className="md:w-64 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos los programas</option>
          {programasActivos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>


      {/* Resultado: cargando */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-primary-700">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando alumnos...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-900 text-white text-left">
                  <th className="px-4 py-3 font-semibold w-14">ID</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Programa</th>
                  <th className="px-4 py-3 font-semibold">Fecha de registro</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <User className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      No se encontraron alumnos.
                      <br />
                      <span className="text-xs text-gray-400">
                        Intenta ajustar la búsqueda o el filtro de programa.
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginados.map((alumno, i) => (
                    <tr
                      key={alumno.id}
                      className={`border-t border-gray-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#fafdf7]'
                      } hover:bg-primary-50 transition`}
                    >
                      <td className="px-4 py-3 text-gray-500">{alumno.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{alumno.nombre}</td>
                      <td className="px-4 py-3 text-gray-600">{alumno.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: alumno.programa_color || '#4caf50' }}
                          />
                          <span className="text-gray-700">
                            {alumno.programa_nombre || 'Sin programa'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatearFecha(alumno.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAlumnoEditando(alumno);
                              setShowForm(true);
                            }}
                            title="Editar"
                            className="p-2 rounded-md text-primary-700 hover:bg-primary-100 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAlumnoReset(alumno)}
                            title="Resetear contraseña"
                            className="p-2 rounded-md text-orange-600 hover:bg-orange-50 transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAlumnoEliminar(alumno)}
                            title="Eliminar"
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>


          {/* Paginación */}
          {filtrados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Mostrando{' '}
                {paginados.length ? (paginaActual - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(paginaActual * PAGE_SIZE, filtrados.length)} de {filtrados.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual >= totalPaginas}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de crear/editar */}
      {showForm && (
        <AlumnoForm
          alumno={alumnoEditando}
          programas={programasActivos}
          onClose={() => {
            setShowForm(false);
            setAlumnoEditando(null);
          }}
          onSave={alumnoEditando ? handleUpdate : handleCreate}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {alumnoEliminar && (
        <ConfirmDeleteModal
          alumno={alumnoEliminar}
          deleting={deleting}
          onCancel={() => setAlumnoEliminar(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Modal de confirmación de eliminación masiva */}
      {showDeleteAll && (
        <ConfirmDeleteAllModal
          total={alumnos.length}
          deleting={deletingAll}
          onCancel={() => setShowDeleteAll(false)}
          onConfirm={handleDeleteAll}
        />
      )}

      {/* Modal de reset de contraseña */}
      {alumnoReset && (
        <ResetPasswordModal
          alumno={alumnoReset}
          onReset={handleReset}
          onClose={() => setAlumnoReset(null)}
        />
      )}
    </div>
  );
}

