/**
 * Servicio de envío de correos con Resend
 *
 * Configuración tomada de las variables de entorno (.env):
 *   RESEND_API_KEY, SMTP_FROM
 *
 * Todas las funciones son "fire and forget": nunca lanzan excepción hacia el
 * llamador; los errores se registran en consola para no romper la respuesta HTTP.
 */
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SMTP_FROM =
  process.env.SMTP_FROM || 'Sistema de Auditorías <onboarding@resend.dev>';

// =============================================
// Envío genérico
// =============================================

async function sendEmail(to, subject, html) {
  try {
    if (!to) {
      console.warn('⚠️  sendEmail: destinatario vacío, correo no enviado');
      return null;
    }

    const { data, error } = await resend.emails.send({
      from: SMTP_FROM,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error(`❌ Error de Resend a ${to}:`, error.message);
      return null;
    }

    console.log(`📧 Correo enviado a ${to} (id: ${data.id})`);
    return data;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${to}:`, error.message);
    return null;
  }
}

// =============================================
// Utilidades de formato
// =============================================

function escapar(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function formatearHora(hora) {
  if (!hora) return 'Por definir';
  if (hora instanceof Date) {
    return hora.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const texto = String(hora);
  const match = texto.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  const d = new Date(texto);
  if (Number.isNaN(d.getTime())) return texto;
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

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

function bloqueDetalle({ fecha, hora, programa, colorBorde = '#4caf50' }) {
  return `
    <div style="background: #ffffff; border-left: 4px solid ${colorBorde}; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>📅 Fecha:</strong> ${escapar(fecha)}</p>
      <p style="margin: 4px 0;"><strong>🕐 Hora:</strong> ${escapar(hora)}</p>
      <p style="margin: 4px 0;"><strong>📚 Programa:</strong> ${escapar(programa)}</p>
    </div>`;
}

// =============================================
// Plantillas de notificación
// =============================================

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
      typeof programa === 'string' ? programa : programa?.nombre || null;
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

    // Resend permite enviar a múltiples destinatarios en un solo correo
    const { data, error } = await resend.emails.send({
      from: SMTP_FROM,
      to: [SMTP_FROM], // el remitente como destinatario principal
      bcc: destinatarios, // los alumnos en BCC (privacidad)
      subject: `📢 Nuevo aviso: ${aviso?.titulo || 'Aviso'}`,
      html,
    });

    if (error) {
      console.error('❌ Error de Resend al enviar aviso:', error.message);
      return null;
    }

    console.log(
      `📧 Aviso enviado a ${destinatarios.length} alumno(s) (id: ${data.id})`
    );
    return data;
  } catch (error) {
    console.error('❌ Error enviando aviso por correo:', error.message);
    return null;
  }
}

module.exports = {
  sendEmail,
  sendCitaCancelada,
  sendCitaAgendada,
  sendAvisoNuevo,
  formatearFecha,
  formatearHora,
  plantillaBase,
};