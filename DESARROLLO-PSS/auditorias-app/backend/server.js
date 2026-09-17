require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const programaRoutes = require('./routes/programas');
const alumnoRoutes = require('./routes/alumnos');
const slotRoutes = require('./routes/slots');
const citaRoutes = require('./routes/citas');
const avisoRoutes = require('./routes/avisos');
const coordinadorRoutes = require('./routes/coordinadores');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/programas', programaRoutes);
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/avisos', avisoRoutes);
app.use('/api/coordinadores', coordinadorRoutes);

// Ruta de salud (health check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Middleware de manejo de errores (siempre al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Login: http://localhost:${PORT}/api/auth/login`);
});
