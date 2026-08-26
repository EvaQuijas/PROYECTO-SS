/**
 * Script de inicialización de la base de datos
 * 
 * Uso: node config/init-db.js
 * 
 * Este script:
 * 1. Lee y ejecuta el esquema SQL (schema.sql)
 * 2. Inserta datos de prueba (seed data)
 * 3. Cierra la conexión y muestra mensaje de éxito
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const SALT_ROUNDS = 10;

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Inicializando base de datos...\n');

    // =============================================
    // 1. Ejecutar el esquema SQL
    // =============================================
    console.log('📦 Ejecutando esquema SQL...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Esquema SQL ejecutado correctamente.\n');

    // =============================================
    // 2. Insertar datos de prueba (seed data)
    // =============================================
    console.log('🌱 Insertando datos de prueba...');

    // --- Coordinador ---
    const passwordHash = await bcrypt.hash('123456', SALT_ROUNDS);

    const coordinadorResult = await client.query(
      `INSERT INTO coordinadores (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Oscar Coordinador', 'coordinador@institucion.edu', passwordHash]
    );

    let coordinadorId;
    if (coordinadorResult.rows.length > 0) {
      coordinadorId = coordinadorResult.rows[0].id;
    } else {
      // Si ya existe, obtener su id
      const existing = await client.query(
        `SELECT id FROM coordinadores WHERE email = $1`,
        ['coordinador@institucion.edu']
      );
      coordinadorId = existing.rows[0].id;
    }
    console.log(`   ✓ Coordinador creado (id: ${coordinadorId})`);

    // --- Programas ---
    const programas = [
      { nombre: 'Innovacion', color_hex: '#1976d2' },
      { nombre: 'Emprendimiento', color_hex: '#388e3c' },
      { nombre: 'Servicio Social', color_hex: '#d32f2f' },
      { nombre: 'Titulacion', color_hex: '#f57c00' },
    ];

    const programaIds = {};
    for (const programa of programas) {
      const result = await client.query(
        `INSERT INTO programas (nombre, color_hex, coordinador_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [programa.nombre, programa.color_hex, coordinadorId]
      );

      if (result.rows.length > 0) {
        programaIds[programa.nombre] = result.rows[0].id;
      } else {
        // Si ya existe, obtener su id
        const existing = await client.query(
          `SELECT id FROM programas WHERE nombre = $1`,
          [programa.nombre]
        );
        programaIds[programa.nombre] = existing.rows[0].id;
      }
      console.log(`   ✓ Programa "${programa.nombre}" creado (id: ${programaIds[programa.nombre]})`);
    }

    // --- Alumnos ---
    const alumnos = [
      { nombre: 'Ana Perez', email: 'alumno@institucion.edu', programa: 'Innovacion' },
      { nombre: 'Carlos Lopez', email: 'carlos@institucion.edu', programa: 'Emprendimiento' },
      { nombre: 'Luis Garcia', email: 'luis@institucion.edu', programa: 'Servicio Social' },
      { nombre: 'Maria Torres', email: 'maria@institucion.edu', programa: 'Titulacion' },
    ];

    for (const alumno of alumnos) {
      const programaId = programaIds[alumno.programa];
      const result = await client.query(
        `INSERT INTO alumnos (nombre, email, password_hash, programa_id, coordinador_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [alumno.nombre, alumno.email, passwordHash, programaId, coordinadorId]
      );

      if (result.rows.length > 0) {
        console.log(`   ✓ Alumno "${alumno.nombre}" creado (id: ${result.rows[0].id})`);
      } else {
        console.log(`   ✓ Alumno "${alumno.nombre}" ya existía, omitido`);
      }
    }

    // =============================================
    // 3. Confirmar éxito
    // =============================================
    console.log('\n🎉 Base de datos inicializada correctamente.');
    console.log('   - Esquema SQL aplicado');
    console.log('   - 1 coordinador creado');
    console.log(`   - ${programas.length} programas creados`);
    console.log(`   - ${alumnos.length} alumnos creados`);
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Coordinador: coordinador@institucion.edu / 123456');
    console.log('   Alumno:      alumno@institucion.edu / 123456');

  } catch (error) {
    console.error('\n❌ Error inicializando la base de datos:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // Cerrar la conexión
    client.release();
    await pool.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

// Ejecutar la inicialización
initDatabase();
