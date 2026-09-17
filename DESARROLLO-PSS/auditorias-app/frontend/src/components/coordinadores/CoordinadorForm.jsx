import { useState } from 'react';
import { X, UserPlus, CheckCircle2, Copy } from 'lucide-react';

// Expresión regular para validar email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal para crear un nuevo coordinador.
 * El campo de contraseña es opcional; si se deja vacío se asigna "123456".
 * @param {{
 *   onSave: (data: object) => Promise<string>,
 *   onClose: () => void
 * }} props
 */
export default function CoordinadorForm({ onSave, onClose }) {
  // 'form' | 'saving' | 'success'
  const [vista, setVista] = useState('form');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creado, setCreado] = useState(null);
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  function validar() {
    if (!nombre.trim()) {
      setError('El nombre del coordinador es requerido');
      return false;
    }

    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('El email no tiene un formato válido');
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

    setVista('saving');
    try {
      const payload = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
      };

      // Solo se envía la contraseña si el usuario escribió una
      if (password.trim()) {
        payload.password = password.trim();
      }

      const passwordAsignada = await onSave(payload);
      setCreado({ nombre: payload.nombre, email: payload.email });
      setPasswordTemporal(passwordAsignada || '123456');
      setVista('success');
    } catch (err) {
      setError(err.message);
      setVista('form');
    }
  }

  /**
   * Copia la contraseña al portapapeles
   */

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
            <UserPlus className="w-5 h-5" />
            Nuevo coordinador
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {vista === 'success' ? (
          /* Paso 2: contraseña temporal asignada */
          <div className="px-6 py-6 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary-600" />
            <div>
              <p className="text-sm text-gray-600 mb-1">
                El coordinador{' '}
                <span className="font-semibold text-gray-800">{creado?.nombre}</span> se
                creó correctamente.
              </p>
              <p className="text-xs text-gray-500">{creado?.email}</p>
              <p className="text-sm text-gray-700 mt-2">Contraseña temporal asignada:</p>
            </div>

            <div className="flex items-center justify-between gap-2 bg-[#e8f5e9] border border-primary-100 rounded-md px-4 py-3">
              <span className="text-xl font-mono font-semibold tracking-widest text-primary-900">
                {passwordTemporal}
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
          /* Paso 1: formulario */
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre completo *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Laura Martínez"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: laura@institucion.edu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña (opcional)
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Si se deja vacío se asigna 123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si no especificas una contraseña se usará la temporal{' '}
                <span className="font-mono font-semibold">123456</span>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={vista === 'saving'}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={vista === 'saving'}
                className="px-4 py-2 rounded-md bg-primary-900 text-white text-sm hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {vista === 'saving' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }
