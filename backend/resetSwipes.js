require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});
pool.query('DELETE FROM swipes WHERE swipe_user_id = 1')
    .then(r => { console.log('✅ Deleted', r.rowCount, 'swipes for Dante'); process.exit(0); })
    .catch(e => { console.error('❌', e.message); process.exit(1); });