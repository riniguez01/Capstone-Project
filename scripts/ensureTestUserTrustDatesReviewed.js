const { Client } = require("pg");

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
require("dotenv").config({ path: require("path").join(__dirname, "..", "backend", ".env") });

async function countDatesReviewed(client, reviewedUserId) {
    const { rows } = await client.query(
        `SELECT COUNT(DISTINCT schedule_id)::int AS c FROM post_date_checkin
         WHERE reviewed_user_id = $1 AND schedule_id IS NOT NULL`,
        [reviewedUserId]
    );
    return rows[0]?.c ?? 0;
}

async function getOrCreateMatchId(client, a, b) {
    const u1 = Math.min(a, b);
    const u2 = Math.max(a, b);
    const ins = await client.query(
        `INSERT INTO matches (user1_id, user2_id, match_status, matched_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (user1_id, user2_id) DO UPDATE SET matched_at = matches.matched_at
         RETURNING match_id`,
        [u1, u2]
    );
    return ins.rows[0].match_id;
}

async function ensureTestUserTrustDatesReviewed(client) {
    const { rows: testUsers } = await client.query(
        `SELECT u.user_id
         FROM users u
         INNER JOIN trust_score ts ON ts.user_id = u.user_id
         WHERE u.email ILIKE '%@test.com' OR u.email ILIKE '%@aura.demo'
         ORDER BY u.user_id`
    );
    const ids = testUsers.map((r) => r.user_id);
    if (ids.length === 0) return;

    for (const row of testUsers) {
        const uid = row.user_id;
        const reviewer = ids.find((id) => id !== uid);
        let n = await countDatesReviewed(client, uid);
        if (reviewer != null && n < 3) {
            const matchId = await getOrCreateMatchId(client, uid, reviewer);
            const need = 3 - n;
            for (let i = 0; i < need; i++) {
                const dayOff = 1 + i + (uid % 50);
                const { rows: dr } = await client.query(
                    `INSERT INTO date_scheduling (
                        match_id, proposed_datetime, venue_type, venue_name, status, created_at
                    ) VALUES ($1, NOW() - (interval '1 day' * $2::int), 'public', 'Demo', 'approved', NOW())
                    RETURNING schedule_id`,
                    [matchId, dayOff]
                );
                const sid = dr[0].schedule_id;
                await client.query(
                    `INSERT INTO post_date_checkin (
                        schedule_id, reviewer_user_id, reviewed_user_id,
                        comfort_level, felt_safe, boundaries_respected, felt_pressured,
                        would_meet_again, created_at
                    ) VALUES ($1, $2, $3, 5, true, true, false, 'Yes', NOW())`,
                    [sid, reviewer, uid]
                );
            }
            n = await countDatesReviewed(client, uid);
        }
    }
}

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    await client.connect();
    try {
        await client.query("BEGIN");
        await ensureTestUserTrustDatesReviewed(client);
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { ensureTestUserTrustDatesReviewed };
