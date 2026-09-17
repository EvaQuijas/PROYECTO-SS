const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/login
 * Autentica a un usuario (coordinador o alumno) y genera un JWT
 */
async function login(req, res) {
  const { email, password } = req.body;

  // Validar que se proporcionen email y password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos',
    });
  }

  try {
    // 1. Buscar primero en tabla coordinadores
    let user = null;
    let role = null;

    const coordinadorResult = await pool.query(
      'SELECT * FROM coordinadores WHERE email = $1',
      [email]
    );

    if (coordinadorResult.rows.length > 0) {
      const coordinador = coordinadorResult.rows[0];
      user = {
        id: coordinador.id,
        email: coordinador.email,
        nombre: coordinador.nombre,
        password_hash: coordinador.password_hash,
        es_principal: coordinador.es_principal === true,
        activo: coordinador.activo !== false,
      };
      role = 'coordinador';
    } else {
      // 2. Si no encuentra, buscar en tabla alumnos
      const alumnoResult = await pool.query(
        `SELECT a.id, a.nombre, a.email, a.password_hash,
                a.programa_id, a.coordinador_id,
                p.nombre AS programa_nombre
         FROM alumnos a
         LEFT JOIN programas p ON p.id = a.programa_id
         WHERE a.email = $1`,
        [email]
      );

      if (alumnoResult.rows.length > 0) {
        const alumno = alumnoResult.rows[0];
        user = {
          id: alumno.id,
          email: alumno.email,
          nombre: alumno.nombre,
          password_hash: alumno.password_hash,
          programa_id: alumno.programa_id,
          coordinador_id: alumno.coordinador_id,
          programa_nombre: alumno.programa_nombre || null,
        };
        role = 'alumno';
      }
    }

    // 3. Si no se encontró el email, responder 401
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // 4. Verificar la contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // 4b. Los coordinadores desactivados no pueden iniciar sesión
    if (role === 'coordinador' && user.activo === false) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta está desactivada. Contacta al coordinador principal.',
      });
    }

    // 5. Generar JWT según el rol
    let payload;
    if (role === 'coordinador') {
      payload = {
        id: user.id,
        email: user.email,
        role: 'coordinador',
        nombre: user.nombre,
        es_principal: user.es_principal || false,
      };
    } else {
      payload = {
        id: user.id,
        email: user.email,
        role: 'alumno',
        nombre: user.nombre,
        programa_id: user.programa_id,
        coordinador_id: user.coordinador_id,
        programa_nombre: user.programa_nombre || null,
      };
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // 6. Responder con token y datos del usuario
    const userResponse = {
      id: user.id,
      email: user.email,
      role,
      nombre: user.nombre,
    };

    if (role === 'coordinador') {
      userResponse.es_principal = user.es_principal || false;
    }

    if (role === 'alumno') {
      userResponse.programa_id = user.programa_id;
      userResponse.coordinador_id = user.coordinador_id;
      userResponse.programa_nombre = user.programa_nombre || null;
    }

    return res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

/**
 * POST /api/auth/register
 * Registra un nuevo coordinador
 */
async function registerCoordinador(req, res) {
  const { nombre, email, password } = req.body;

  // Validar campos requeridos
  if (!nombre || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, email y contraseña son requeridos',
    });
  }

  try {
    // 1. Verificar que el email no exista ya en coordinadores
    const existing = await pool.query(
      'SELECT id FROM coordinadores WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insertar el nuevo coordinador
    const result = await pool.query(
      `INSERT INTO coordinadores (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email`,
      [nombre, email, passwordHash]
    );

    const nuevoCoordinador = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Coordinador creado exitosamente',
      coordinador: {
        id: nuevoCoordinador.id,
        nombre: nuevoCoordinador.nombre,
        email: nuevoCoordinador.email,
      },
    });
  } catch (error) {
    console.error('Error en registerCoordinador:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

module.exports = {
  login,
  registerCoordinador,
};
