/**
 * Script ejecutable de migración
 *
 * Uso: node config/run-migration.js
 *
 * Este script:
 * 1. Lee y ejecuta el SQL de migración (migration-superadmin.sql)
 * 2. Muestra el estado de los coordinadores después de migrar
 * 3. Cierra la conexión y muestra mensaje de éxito
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Ejecutando migración: Coordinador Principal (Superadmin)...\n');

    const migrationPath = path.join(__dirname, 'migration-superadmin.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);
    console.log('✅ Migración SQL ejecutada correctamente.\n');

    // Mostrar el estado resultante
    const result = await client.query(
      `SELECT id, nombre, email, es_principal, activo, created_at
       FROM coordinadores
       ORDER BY es_principal DESC, id ASC`
    );

    console.log('📋 Coordinadores registrados:');
    if (result.rows.length === 0) {
      console.log('   (sin registros)');
    } else {
      for (const c of result.rows) {
        const principal = c.es_principal ? ' [PRINCIPAL]' : '';
        const estado = c.activo ? 'activo' : 'inactivo';
        console.log(`   ✓ ${c.nombre} <${c.email}> (${estado})${principal}`);
      }
    }

    const principal = result.rows.find((c) => c.es_principal);
    if (principal) {
      console.log(`\n👑 Coordinador principal: ${principal.email}`);
      console.log('   Puede administrar otros coordinadores desde el panel.');
    } else {
      console.log('\n⚠️  No se encontró ningún coordinador principal.');
      console.log("   Verifica que exista el email 'coordinador@institucion.edu'.");
    }

    console.log('\n🎉 Migración completada.');
  } catch (error) {
    console.error('\n❌ Error ejecutando la migración:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

runMigration();
