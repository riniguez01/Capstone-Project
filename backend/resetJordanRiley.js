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
    const jordanResult = await pool.query(
        `SELECT user_id FROM users WHERE first_name = 'Jordan' LIMIT 1`
    );
    const rileyResult = await pool.query(
        `SELECT user_id FROM users WHERE first_name = 'Riley' LIMIT 1`
    );

    if (jordanResult.rows.length === 0) {
        console.error('Jordan not found in users table');
        process.exit(1);
    }
    if (rileyResult.rows.length === 0) {
        console.error('Riley not found in users table');
        process.exit(1);
    }

    const jordanId = jordanResult.rows[0].user_id;
    const rileyId  = rileyResult.rows[0].user_id;

    console.log(`Found Jordan: user_id=${jordanId}`);
    console.log(`Found Riley:  user_id=${rileyId}`);

    const notifResult = await pool.query(
        `DELETE FROM notifications WHERE user_id = $1 OR user_id = $2`,
        [jordanId, rileyId]
    );
    console.log(`Deleted ${notifResult.rowCount} notifications for Jordan and Riley`);

    const matchResult = await pool.query(
        `SELECT match_id FROM matches
         WHERE (user1_id = $1 AND user2_id = $2)
            OR (user1_id = $2 AND user2_id = $1)`,
        [jordanId, rileyId]
    );

    if (matchResult.rows.length > 0) {
        const matchId = matchResult.rows[0].match_id;
        console.log(`Found match_id=${matchId} — clearing in dependency order...`);

        const scheduleRows = await pool.query(
            `SELECT schedule_id FROM date_scheduling WHERE match_id = $1`,
            [matchId]
        );

        if (scheduleRows.rows.length > 0) {
            const scheduleIds = scheduleRows.rows.map(r => r.schedule_id);
            await pool.query(
                `DELETE FROM post_date_checkin WHERE schedule_id = ANY($1::int[])`,
                [scheduleIds]
            );
            console.log('  Cleared post_date_checkin');

            await pool.query(
                `DELETE FROM survey_trigger WHERE schedule_id = ANY($1::int[])`,
                [scheduleIds]
            );
            console.log('  Cleared survey_trigger');
        }

        await pool.query(`DELETE FROM date_scheduling WHERE match_id = $1`, [matchId]);
        console.log('  Cleared date_scheduling');

        await pool.query(`DELETE FROM safety_actions WHERE match_id = $1`, [matchId]);
        console.log('  Cleared safety_actions');

        await pool.query(`DELETE FROM conversation_safety_state WHERE match_id = $1`, [matchId]);
        console.log('  Cleared conversation_safety_state');

        await pool.query(`DELETE FROM message WHERE match_id = $1`, [matchId]);
        console.log('  Cleared messages');

        await pool.query(`DELETE FROM matches WHERE match_id = $1`, [matchId]);
        console.log('  Deleted match');
    } else {
        console.log('No existing match found between Jordan and Riley');
    }

    const swipes = await pool.query(
        `DELETE FROM swipes
         WHERE (swipe_user_id = $1 AND swiped_user_id = $2)
            OR (swipe_user_id = $2 AND swiped_user_id = $1)`,
        [jordanId, rileyId]
    );
    console.log(`Deleted ${swipes.rowCount} swipes between Jordan and Riley`);

    console.log('');
    console.log('Jordan and Riley are fully reset.');
    console.log('IMPORTANT: Restart the backend server to clear the in-memory safety engine state.');
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });