// config/db.js
// PostgreSQL connection pool using pg.
// Reads credentials from .env (never hardcode in source).
// Railway/AWS connection uses SSL — disabled for Railway's internal proxy.

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL database"))
    .catch(err => console.error("❌ Database connection failed:", err.message));

module.exports = pool;