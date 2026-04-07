require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      { rejectUnauthorized: false }
});

async function run() {
    const swipesResult = await pool.query(
        'DELETE FROM swipes WHERE swipe_user_id = $1',
        [1]
    );
    console.log(`Deleted ${swipesResult.rowCount} swipes for Dante`);

    const matchesResult = await pool.query(
        'DELETE FROM matches WHERE user1_id = $1 OR user2_id = $1',
        [1]
    );
    console.log(`Deleted ${matchesResult.rowCount} matches for Dante`);

    const check = await pool.query(
        `SELECT tier_id FROM users WHERE user_id = 1`
    );
    const tierId = check.rows[0]?.tier_id || 1;
    const limits = { 1: 3, 2: 5 };
    const limit  = limits[tierId] || 3;

    console.log(`Dante is tier ${tierId} — likes reset to ${limit}/${limit}`);
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });