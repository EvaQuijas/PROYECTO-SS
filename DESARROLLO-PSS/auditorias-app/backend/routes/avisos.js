const express = require('express');
const router = express.Router();
const avisoController = require('../controllers/avisoController');
const { verifyToken, requireRole, requireCoordinador } = require('../middleware/auth');
const { validateAviso } = require('../middleware/validators');

// GET /api/avisos - Todos los avisos del coordinador
router.get('/', verifyToken, requireCoordinador, avisoController.getAll);

// GET /api/avisos/programa/:programa_id - Avisos del coordinador por programa
router.get('/programa/:programa_id', verifyToken, requireCoordinador, avisoController.getByPrograma);

// GET /api/avisos/globales - Avisos globales del coordinador
router.get('/globales', verifyToken, requireCoordinador, avisoController.getGlobales);

// GET /api/avisos/mis-avisos - Avisos para el alumno (globales + su programa)
router.get('/mis-avisos', verifyToken, requireRole(['alumno']), avisoController.getParaAlumno);

// POST /api/avisos - Crear aviso
router.post('/', verifyToken, requireCoordinador, validateAviso, avisoController.create);

// PUT /api/avisos/:id - Actualizar aviso
router.put('/:id', verifyToken, requireCoordinador, validateAviso, avisoController.update);

// DELETE /api/avisos/all - Eliminar TODOS los avisos del coordinador
// ⚠️ Debe declararse ANTES de '/:id' para que "all" no se interprete como un id
router.delete('/all', verifyToken, requireCoordinador, avisoController.deleteAll);

// DELETE /api/avisos/:id - Eliminar aviso
router.delete('/:id', verifyToken, requireCoordinador, avisoController.delete);

module.exports = router;
