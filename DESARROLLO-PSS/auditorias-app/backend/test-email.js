const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'quijaslucette@gmail.com', // ← Tu correo Gmail
    pass: 'tmco ntgr ouqy lxnn', // ← Contraseña de aplicación (16 caracteres)
  },
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error de conexión:', error.message);
  } else {
    console.log('✅ Servidor listo para enviar correos');
  }
});

// Opcional: enviar correo de prueba
transporter.sendMail({
  from: '"Sistema de Auditorías" <quijaslucette@gmail.com>',
  to: 'evangelina.quijass@uanl.edu.mx', // ← Tu correo UANL
  subject: 'Prueba de envío',
  text: 'Este es un correo de prueba del Sistema de Auditorías',
  html: '<h1>¡Funciona!</h1><p>El sistema de correos está configurado correctamente.</p>',
}, (error, info) => {
  if (error) {
    console.log('❌ Error al enviar:', error.message);
  } else {
    console.log('✅ Correo enviado:', info.response);
  }
});