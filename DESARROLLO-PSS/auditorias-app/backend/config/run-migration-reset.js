const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Ejecutando migración: Recuperación de contraseña...');
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migration-reset-password.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('✅ Migración SQL ejecutada correctamente.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Conexión cerrada.');
  }
}

runMigration();