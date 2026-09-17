const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumnoController');
const { verifyToken, requireCoordinador } = require('../middleware/auth');
const { validateAlumno } = require('../middleware/validators');

// Todas las rutas de alumnos requieren autenticación y rol de coordinador
router.use(verifyToken, requireCoordinador);

// GET /api/alumnos - Listar todos los alumnos del coordinador
router.get('/', alumnoController.getAll);

// GET /api/alumnos/programa/:programa_id - Alumnos por programa
router.get('/programa/:programa_id', alumnoController.getByPrograma);

// GET /api/alumnos/:id - Obtener un alumno por ID
router.get('/:id', alumnoController.getById);

// POST /api/alumnos - Crear un nuevo alumno
router.post('/', validateAlumno, alumnoController.create);

// PUT /api/alumnos/:id - Actualizar un alumno
router.put('/:id', validateAlumno, alumnoController.update);

// POST /api/alumnos/:id/reset-password - Restablecer contraseña
router.post('/:id/reset-password', alumnoController.resetPassword);

// DELETE /api/alumnos/all - Eliminar TODOS los alumnos del coordinador
// ⚠️ Debe declararse ANTES de '/:id' para que "all" no se interprete como un id
router.delete('/all', alumnoController.deleteAll);

// DELETE /api/alumnos/:id - Eliminar un alumno
router.delete('/:id', alumnoController.delete);

module.exports = router;
