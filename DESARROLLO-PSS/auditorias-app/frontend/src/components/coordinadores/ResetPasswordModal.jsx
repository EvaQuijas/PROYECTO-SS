import { useState } from 'react';
import { X, KeyRound, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';

/**
 * Modal para restablecer la contraseña de un coordinador.
 * Después de confirmar, muestra la nueva contraseña temporal (123456).
 * @param {{
 *   coordinador: {id: number|string, nombre: string, email?: string},
 *   onReset: (coordinador: object) => Promise<string>,
 *   onClose: () => void
 * }} props
 */
export default function ResetPasswordModal({ coordinador, onReset, onClose }) {
  // 'confirm' | 'doing' | 'success'
  const [vista, setVista] = useState('confirm');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');

  /**
   * Ejecuta el reseteo y muestra la nueva contraseña
   */
  async function handleReset() {
    setVista('doing');
    setError('');
    try {
      const password = await onReset(coordinador);
      setNuevaPassword(password || '123456');
      setVista('success');
    } catch (err) {
      setError(err.message);
      setVista('confirm');
    }
  }

  /**
   * Copia la contraseña al portapapeles
   */
  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(nuevaPassword);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
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
        <div className="flex items-center justify-between px-6 py-4 bg-orange-500 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Resetear contraseña
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
            /* Paso 2: contraseña temporal generada */
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary-600" />
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  La contraseña del coordinador{' '}
                  <span className="font-semibold text-gray-800">
                    {coordinador.nombre}
                  </span>{' '}
                  se restableció correctamente.
                </p>
                <p className="text-sm text-gray-700">Nueva contraseña temporal:</p>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#e8f5e9] border border-primary-100 rounded-md px-4 py-3">
                <span className="text-xl font-mono font-semibold tracking-widest text-primary-900">
                  {nuevaPassword}
                </span>
                <button
                  onClick={handleCopiar}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs bg-primary-700 text-white hover:bg-primary-800 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiado ? 'Copiada' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Comparte esta contraseña con el coordinador. Podrá cambiarla después de
                iniciar sesión.
              </p>

              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 transition w-full"
              >
                Listo
              </button>
            </div>
          ) : (
            /* Paso 1: confirmación */
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  ¿Seguro que deseas restablecer la contraseña de{' '}
                  <span className="font-semibold">{coordinador.nombre}</span>?
                  <br />
                  <span className="text-xs text-gray-500">
                    Se asignará la contraseña temporal{' '}
                    <span className="font-mono font-semibold">123456</span>, que el
                    coordinador deberá cambiar al iniciar sesión.
                  </span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={vista === 'doing'}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReset}
                  disabled={vista === 'doing'}
                  className="px-4 py-2 rounded-md bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {vista === 'doing' ? 'Reseteando...' : 'Resetear'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
