const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Servidor listo para enviar correos con OAuth 2.0');
  }
});

// Enviar correo de prueba
transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'evangelina.quijass@uanl.edu.mx',
  subject: 'Prueba OAuth 2.0',
  text: 'Este correo usa OAuth 2.0 con Gmail',
}, (error, info) => {
  if (error) {
    console.log('❌ Error al enviar:', error.message);
  } else {
    console.log('✅ Correo enviado:', info.response);
  }
});