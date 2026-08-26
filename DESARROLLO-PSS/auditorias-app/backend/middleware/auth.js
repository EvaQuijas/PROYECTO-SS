const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar el token JWT en las peticiones
 * Espera el header: Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  // Obtener el header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado',
    });
  }

  // El formato esperado es: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido',
    });
  }

  const token = parts[1];

  try {
    // Verificar el token con el secreto
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
}

/**
 * Middleware factory que verifica que el rol del usuario esté permitido
 * @param {string[]} roles - Array de roles permitidos, ej: ['coordinador', 'alumno']
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Rol requerido: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Middleware específico para verificar que el usuario sea coordinador
 */
function requireCoordinador(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado',
    });
  }

  if (req.user.role !== 'coordinador') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo coordinadores',
    });
  }

  next();
}

module.exports = {
  verifyToken,
  requireRole,
  requireCoordinador,
};
