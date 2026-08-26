const { Pool } = require('pg');
require('dotenv').config();

// Configuración del Pool de conexiones a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper para ejecutar consultas SQL
async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
};
