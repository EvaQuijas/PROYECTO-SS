const express = require('express');
const router = express.Router();
const programaController = require('../controllers/programaController');
const { verifyToken, requireCoordinador } = require('../middleware/auth');
const { validatePrograma } = require('../middleware/validators');

// Todas las rutas de programas requieren autenticación y rol de coordinador
router.use(verifyToken, requireCoordinador);

// GET /api/programas - Listar todos los programas del coordinador
router.get('/', programaController.getAll);

// GET /api/programas/:id - Obtener un programa por ID
router.get('/:id', programaController.getById);

// POST /api/programas - Crear un nuevo programa
router.post('/', validatePrograma, programaController.create);

// PUT /api/programas/:id - Actualizar un programa
router.put('/:id', programaController.update);

// PATCH /api/programas/:id/toggle - Cambiar estado activo
router.patch('/:id/toggle', programaController.toggleActive);

// DELETE /api/programas/:id - Eliminar un programa
router.delete('/:id', programaController.delete);

module.exports = router;
