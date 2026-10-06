const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/register - Registrar coordinador
router.post('/register', authController.registerCoordinador);

// GET /api/auth/verify - Verificar token (opcional)
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password - Establecer nueva contraseña
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/change-password - Cambiar contraseña estando autenticado
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
