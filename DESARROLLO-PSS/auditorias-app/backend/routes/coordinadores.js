const express = require('express');
const router = express.Router();
const coordinadorController = require('../controllers/coordinadorController');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser el coordinador principal
router.use(verifyToken, requireSuperAdmin);

// GET /api/coordinadores - Listar todos los coordinadores
router.get('/', coordinadorController.getAll);

// POST /api/coordinadores - Crear un nuevo coordinador
router.post('/', coordinadorController.create);

// PATCH /api/coordinadores/:id/toggle - Activar/Desactivar coordinador
router.patch('/:id/toggle', coordinadorController.toggleActivo);

// POST /api/coordinadores/:id/reset-password - Resetear contraseña a la temporal
router.post('/:id/reset-password', coordinadorController.resetPassword);

// DELETE /api/coordinadores/:id - Eliminar coordinador
router.delete('/:id', coordinadorController.delete);

module.exports = router;
