import { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import * as authService from "../../services/authService";

/**
 * Modal para que el usuario autenticado (coordinador o alumno) cambie su
 * propia contraseña. Requiere la contraseña actual y confirma la nueva.
 * @param {{ onClose: () => void }} props
 */
export default function ChangePasswordModal({ onClose }) {
  // 'form' | 'doing' | 'success'
  const [vista, setVista] = useState('form');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  // Validación local inmediata (mismas reglas que el backend)
  const nuevoValido = newPassword.length >= 6;
  const coincide = newPassword === confirmPassword;
  const distinta = newPassword !== currentPassword && newPassword.length > 0;
  const formValido =
    currentPassword.length > 0 && nuevoValido && coincide && distinta;

  /**
   * Envía el cambio de contraseña al backend
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!formValido) {
      if (!nuevoValido) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
      } else if (!coincide) {
        setError('La confirmación no coincide con la nueva contraseña');
      } else if (!distinta) {
        setError('La nueva contraseña debe ser diferente a la actual');
      }
      return;
    }

    setVista('doing');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setVista('success');
    } catch (err) {
      setError(err.message);
      setVista('form');
    }
  }

  // Mensaje de ayuda dinámico bajo el campo "nueva contraseña"
  function ayudaNueva() {
    if (newPassword.length === 0) return null;
    if (!nuevoValido) {
      return (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Debe tener al menos 6 caracteres
        </p>
      );
    }
    if (!distinta) {
      return (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Debe ser diferente a la actual
        </p>
      );
    }
    return (
      <p className="mt-1 text-xs text-primary-700 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Contraseña válida
      </p>
    );
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
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Cambiar contraseña
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {vista === 'success' ? (
            /* Confirmación final */
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary-600" />
              <div>
                <p className="font-semibold text-gray-800">
                  Contraseña actualizada exitosamente
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Usa tu nueva contraseña la próxima vez que inicies sesión.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 transition w-full"
              >
                Listo
              </button>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {ayudaNueva()}
              </div>

              {/* Confirmar nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && !coincide && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {/* Error del backend o de validación */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={vista === 'doing'}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={vista === 'doing' || !formValido}
                  className="px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {vista === 'doing' ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
