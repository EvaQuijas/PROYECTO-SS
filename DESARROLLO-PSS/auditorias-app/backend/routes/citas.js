const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { verifyToken, requireCoordinador, requireRole } = require('../middleware/auth');

// POST /api/citas/reservar - Alumno reserva un slot
router.post('/reservar', verifyToken, requireRole(['alumno']), citaController.reservar);

// POST /api/citas/agendar-manual - Coordinador agenda manualmente
router.post('/agendar-manual', verifyToken, requireCoordinador, citaController.agendarManual);

// GET /api/citas/mis-citas - Alumno ve sus citas
router.get('/mis-citas', verifyToken, requireRole(['alumno']), citaController.getMisCitas);

// GET /api/citas/todas - Coordinador ve todas las citas
router.get('/todas', verifyToken, requireCoordinador, citaController.getCitasCoordinador);

// PATCH /api/citas/:id/cancelar - Cancelar cita
router.patch('/:id/cancelar', verifyToken, citaController.cancelar);

// PATCH /api/citas/:id/asistencia - Registrar asistencia
router.patch('/:id/asistencia', verifyToken, requireCoordinador, citaController.registrarAsistencia);

// PATCH /api/citas/:id/inasistencia - Registrar inasistencia
router.patch('/:id/inasistencia', verifyToken, requireCoordinador, citaController.registrarInasistencia);

// DELETE /api/citas/historial - Limpiar historial (citas finalizadas)
// ⚠️ Debe ir ANTES de cualquier ruta '/:id' para evitar conflictos
router.delete('/historial', verifyToken, requireCoordinador, citaController.deleteHistorial);

module.exports = router;