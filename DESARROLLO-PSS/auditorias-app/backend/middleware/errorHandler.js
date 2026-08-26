/**
 * Middleware global de manejo de errores
 * Debe tener 4 parámetros para que Express lo reconozca como error handler
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Error de validación de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }

  // Error de base de datos (pg)
  if (err.code && err.code.startsWith('2')) {
    // Códigos 22xxx son errores de datos (violación de constraint, etc.)
    return res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
    });
  }

  if (err.code && err.code.startsWith('3')) {
    // Códigos 3xxxx son errores de conexión o permisos
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos',
    });
  }

  // Error de validación de express
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
}

module.exports = errorHandler;
