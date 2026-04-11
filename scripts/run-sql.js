/**
 * Run a .sql file using the same DB_* variables as backend/config/db.js.
 * Usage: node scripts/run-sql.js database/ensure_test_users_complete.sql
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const sqlPath = path.resolve(process.argv[2] || "");
if (!sqlPath || !fs.existsSync(sqlPath)) {
    console.error("Usage: node scripts/run-sql.js <path-to.sql>");
    process.exit(1);
}

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL } = process.env;
if (!DB_HOST || !DB_NAME || !DB_USER) {
    console.error("Missing DB_* in .env (need DB_HOST, DB_NAME, DB_USER).");
    process.exit(1);
}

const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT, 10) || 5432,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

(async () => {
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.connect();
    await client.query(sql);
    console.log("OK:", sqlPath);
    await client.end();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
