const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { verifyToken, requireCoordinador } = require('../middleware/auth');

// Todas las rutas de slots requieren autenticación y rol de coordinador
router.use(verifyToken, requireCoordinador);

// GET /api/slots/semana - Obtener slots de la semana
router.get('/semana', slotController.getSlotsSemana);

// POST /api/slots/rango - Generar slots en rango
router.post('/rango', slotController.generarRango);

// POST /api/slots/individual - Crear slot individual
router.post('/individual', slotController.agregarSlotIndividual);

// POST /api/slots/eliminar-rango - Eliminar slots en rango
router.post('/eliminar-rango', slotController.eliminarRango);

// POST /api/slots/eliminar-dia - Eliminar slots de un día
router.post('/eliminar-dia', slotController.eliminarDia);

// POST /api/slots/regenerar-rango - Regenerar slots en rango
router.post('/regenerar-rango', slotController.regenerarRango);

// DELETE /api/slots/:id - Eliminar un slot individual
router.delete('/:id', slotController.eliminarSlot);

module.exports = router;
