/**
 * Servicio de envío de correos con Nodemailer
 *
 * Configuración tomada de las variables de entorno (.env):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Todas las funciones son "fire and forget": nunca lanzan excepción hacia el
 * llamador; los errores se registran en consola para no romper la respuesta HTTP.
 */

const nodemailer = require('nodemailer');

// =============================================
// Configuración del transporter
// =============================================
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM || 'Sistema de Auditorías <no-reply@institucion.edu>';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true para 465, false para 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// =============================================
// Utilidades de formato
// =============================================

/**
 * Escapa caracteres HTML para evitar inyección en las plantillas
 * @param {*} valor
 * @returns {string}
 */
function escapar(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatea una fecha (ISO o Date) a un texto legible en español
 * @param {string|Date} fecha
 * @returns {string}
 */
function formatearFecha(fecha) {
  if (!fecha) return 'Por definir';
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha);
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea una hora (Date, "HH:MM:SS" o timestamp) a "HH:MM"
 * @param {string|Date} hora
 * @returns {string}
 */
function formatearHora(hora) {
  if (!hora) return 'Por definir';
  if (hora instanceof Date) {
    return hora.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const texto = String(hora);
  // Si ya viene como "HH:MM:SS" o "HH:MM" se recorta sin usar zona horaria
  const match = texto.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  const d = new Date(texto);
  if (Number.isNaN(d.getTime())) return texto;
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Envuelve el contenido en la plantilla base con la paleta verde
 * @param {{titulo: string, icono?: string, colorEncabezado?: string, contenido: string}} opciones
 * @returns {string} HTML completo
 */
function plantillaBase({ titulo, icono = '', colorEncabezado = '#1b5e20', contenido }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #c8e6c9; border-radius: 8px; overflow: hidden;">
    <div style="background: ${colorEncabezado}; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px;">${icono} ${escapar(titulo)}</h1>
    </div>
    <div style="padding: 24px; background: #f1f8e9; color: #333333; font-size: 15px; line-height: 1.6;">
      ${contenido}
    </div>
    <div style="background: #2e7d32; color: #ffffff; padding: 12px; text-align: center; font-size: 12px;">
      Sistema de Gestión de Auditorías - UANL
    </div>
  </div>`;
}

/**
 * Bloque de detalle reutilizable (fecha, hora, programa)
 * @param {{fecha: string, hora: string, programa: string, colorBorde?: string}} datos
 * @returns {string}
 */
function bloqueDetalle({ fecha, hora, programa, colorBorde = '#4caf50' }) {
  return `
    <div style="background: #ffffff; border-left: 4px solid ${colorBorde}; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>📅 Fecha:</strong> ${escapar(fecha)}</p>
      <p style="margin: 4px 0;"><strong>🕐 Hora:</strong> ${escapar(hora)}</p>
      <p style="margin: 4px 0;"><strong>📚 Programa:</strong> ${escapar(programa)}</p>
    </div>`;
}

// =============================================
// Envío genérico
// =============================================

/**
 * Envía un correo genérico
 * @param {string} to - destinatario (o lista separada por comas)
 * @param {string} subject - asunto
 * @param {string} html - cuerpo en HTML
 * @returns {Promise<object|null>} info del envío o null si falló
 */
async function sendEmail(to, subject, html) {
  try {
    if (!to) {
      console.warn('⚠️  sendEmail: destinatario vacío, correo no enviado');
      return null;
    }

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log(`📧 Correo enviado a ${to} (id: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${to}:`, error.message);
    return null;
  }
}

// =============================================
// Plantillas de notificación
// =============================================

/**
 * Notifica al alumno que su cita fue cancelada
 * @param {{nombre?: string, email: string}} alumno
 * @param {{fecha?: string, hora_inicio?: string, hora_fin?: string}} cita
 * @param {{nombre?: string}|string|null} programa
 * @returns {Promise<object|null>}
 */
async function sendCitaCancelada(alumno, cita, programa) {
  const nombre = alumno?.nombre || 'Alumno';
  const programaNombre =
    typeof programa === 'string' ? programa : programa?.nombre || 'Sin programa';

  const contenido = `
    <p style="margin-top: 0;">Hola <strong>${escapar(nombre)}</strong>,</p>
    <p>Tu cita de auditoría ha sido <strong>cancelada</strong>.</p>
    ${bloqueDetalle({
      fecha: formatearFecha(cita?.fecha),
      hora: formatearHora(cita?.hora_inicio),
      programa: programaNombre,
      colorBorde: '#e53935',
    })}
    <p>Por favor, agenda una nueva cita en el sistema.</p>`;

  const html = plantillaBase({
    titulo: 'Cita Cancelada',
    icono: '❌',
    colorEncabezado: '#1b5e20',
    contenido,
  });

  return sendEmail(alumno?.email, '❌ Tu cita de auditoría fue cancelada', html);
}

/**
 * Notifica al alumno que el coordinador agendó una cita
 * @param {{nombre?: string, email: string}} alumno
 * @param {{fecha?: string, hora_inicio?: string, hora_fin?: string}} cita
 * @param {{nombre?: string}|string|null} programa
 * @returns {Promise<object|null>}
 */
async function sendCitaAgendada(alumno, cita, programa) {
  const nombre = alumno?.nombre || 'Alumno';
  const programaNombre =
    typeof programa === 'string' ? programa : programa?.nombre || 'Sin programa';

  const contenido = `
    <p style="margin-top: 0;">Hola <strong>${escapar(nombre)}</strong>,</p>
    <p>Se ha <strong>agendado</strong> una cita de auditoría para ti.</p>
    ${bloqueDetalle({
      fecha: formatearFecha(cita?.fecha),
      hora: formatearHora(cita?.hora_inicio),
      programa: programaNombre,
      colorBorde: '#4caf50',
    })}
    <p>Te esperamos en la fecha y hora indicadas. ¡No faltes!</p>`;

  const html = plantillaBase({
    titulo: 'Cita Agendada',
    icono: '✅',
    colorEncabezado: '#2e7d32',
    contenido,
  });

  return sendEmail(alumno?.email, '✅ Nueva cita de auditoría agendada', html);
}

/**
 * Notifica a una lista de alumnos sobre un nuevo aviso.
 * Envía un único correo con copia oculta (BCC) para no exponer los correos.
 * @param {Array<{nombre?: string, email: string}>} alumnos
 * @param {{titulo?: string, contenido?: string}} aviso
 * @param {{nombre?: string}|string|null} programa - null/'' => aviso global
 * @returns {Promise<object|null>}
 */
async function sendAvisoNuevo(alumnos, aviso, programa) {
  try {
    const lista = Array.isArray(alumnos) ? alumnos : [];
    const destinatarios = lista
      .map((a) => a?.email)
      .filter((email) => !!email);

    if (destinatarios.length === 0) {
      console.warn('⚠️  sendAvisoNuevo: no hay destinatarios, correo no enviado');
      return null;
    }

    const programaNombre =
      typeof programa === 'string'
        ? programa
        : programa?.nombre || null;
    const esGlobal = !programaNombre;

    const contenido = `
      <p style="margin-top: 0;">Hola,</p>
      <p>Se ha publicado un nuevo aviso${
        esGlobal ? ' <strong>para todos los programas</strong>' : ''
      }.</p>
      <div style="background: #ffffff; border-left: 4px solid ${
        esGlobal ? '#6b7280' : '#4caf50'
      }; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 4px 0;"><strong>📢 Título:</strong> ${escapar(
          aviso?.titulo
        )}</p>
        <p style="margin: 4px 0;"><strong>📚 Programa:</strong> ${escapar(
          programaNombre || 'Global'
        )}</p>
        <p style="margin: 12px 0 0 0; white-space: pre-wrap;">${escapar(
          aviso?.contenido
        )}</p>
      </div>
      <p>Ingresa al sistema para consultar los detalles.</p>`;

    const html = plantillaBase({
      titulo: 'Nuevo Aviso',
      icono: '📢',
      colorEncabezado: '#1b5e20',
      contenido,
    });

    // Se envía al propio remitente y a los alumnos en BCC (privacidad)
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: SMTP_FROM,
      bcc: destinatarios.join(', '),
      subject: `📢 Nuevo aviso: ${aviso?.titulo || 'Aviso'}`,
      html,
    });

    console.log(
      `📧 Aviso enviado a ${destinatarios.length} alumno(s) (id: ${info.messageId})`
    );
    return info;
  } catch (error) {
    console.error('❌ Error enviando aviso por correo:', error.message);
    return null;
  }
}

module.exports = {
  transporter,
  sendEmail,
  sendCitaCancelada,
  sendCitaAgendada,
  sendAvisoNuevo,
  formatearFecha,
  formatearHora,
  plantillaBase,
};

