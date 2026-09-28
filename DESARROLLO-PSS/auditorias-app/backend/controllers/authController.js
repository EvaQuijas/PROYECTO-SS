const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const crypto = require('crypto');
const { sendEmail, plantillaBase } = require('../utils/emailService');

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
/**
 * POST /api/auth/forgot-password
 * Genera un token de recuperación y lo envía por correo
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'El correo es requerido',
    });
  }

  // Respuesta que damos SIEMPRE, exista o no el correo
  const mensajeGenerico =
    'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

  try {
    // 1. Buscar en qué tabla está el correo (mismo orden que el login)
    let tabla = null;

    const coordinador = await pool.query(
      'SELECT id FROM coordinadores WHERE email = $1',
      [email]
    );

    if (coordinador.rows.length > 0) {
      tabla = 'coordinadores';
    } else {
      const alumno = await pool.query(
        'SELECT id FROM alumnos WHERE email = $1',
        [email]
      );
      if (alumno.rows.length > 0) {
        tabla = 'alumnos';
      }
    }

    // 2. Si no existe, respondemos igual (sin revelar nada)
    if (!tabla) {
      return res.status(200).json({ success: true, message: mensajeGenerico });
    }

    // 3. Generar token aleatorio y su versión hasheada
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 4. Guardar el hash y la expiración (1 hora) en la base de datos
    await pool.query(
      `UPDATE ${tabla}
       SET reset_token = $1, reset_token_expira = NOW() + INTERVAL '1 hour'
       WHERE email = $2`,
      [tokenHash, email]
    );

    // 5. Armar el link y enviar el correo
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/reset-password?token=${token}`;

    const contenido = `
      <p style="margin-top: 0;">Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${link}" style="background: #2e7d32; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace es válido por 1 hora. Si no fuiste tú, ignora este correo.</p>`;

    const html = plantillaBase({
      titulo: 'Recuperar contraseña',
      icono: '🔑',
      contenido,
    });

    await sendEmail(email, '🔑 Recuperación de contraseña', html);

    // En desarrollo mostramos el link en consola (útil si no hay SMTP configurado)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Link de recuperación para ${email}: ${link}`);
    }

    return res.status(200).json({ success: true, message: mensajeGenerico });
  } catch (error) {
    console.error('Error en forgotPassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Cambia la contraseña usando el token recibido por correo
 */
async function resetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token y contraseña son requeridos',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  try {
    // 1. Hashear el token recibido para compararlo con el guardado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Buscar un token válido (que exista y no haya caducado)
    let tabla = null;

    const coordinador = await pool.query(
      'SELECT id FROM coordinadores WHERE reset_token = $1 AND reset_token_expira > NOW()',
      [tokenHash]
    );

    if (coordinador.rows.length > 0) {
      tabla = 'coordinadores';
    } else {
      const alumno = await pool.query(
        'SELECT id FROM alumnos WHERE reset_token = $1 AND reset_token_expira > NOW()',
        [tokenHash]
      );
      if (alumno.rows.length > 0) {
        tabla = 'alumnos';
      }
    }

    if (!tabla) {
      return res.status(400).json({
        success: false,
        message: 'El enlace es inválido o ya expiró',
      });
    }

    // 3. Guardar la contraseña nueva y borrar el token (un solo uso)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      `UPDATE ${tabla}
       SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL
       WHERE reset_token = $2`,
      [passwordHash, tokenHash]
    );

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error en resetPassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

module.exports = {
  login,
  registerCoordinador,
  forgotPassword,
  resetPassword,
};
