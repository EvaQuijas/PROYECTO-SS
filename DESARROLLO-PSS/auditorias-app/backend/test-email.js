require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

sendEmail(
  'evangelina.quijass@uanl.edu.mx',
  'Prueba de SendGrid',
  '<h1>¡Funciona!</h1><p>Correo enviado con SendGrid</p>'
).then(() => {
  console.log('Prueba terminada');
  process.exit(0);
});