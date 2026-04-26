const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

function makeClient() {
    return new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
}

async function insertTempUser(client, email) {
    const result = await client.query(
        `INSERT INTO users (
            first_name, last_name, email, password_hash, date_of_birth, gender_identity,
            account_status, created_at, last_login, height_inches, location_city, location_state,
            latitude, longitude, role_id, tier_id, language_id
        ) VALUES (
            'Feature', 'Verifier', $1, 'x', '1998-01-01', 4,
            'active', NOW(), NOW(), 66, 'Chicago', 'IL',
            41.878113, -87.629799, 1, 1, 1
        )
        RETURNING user_id`,
        [email]
    );
    return Number(result.rows[0].user_id);
}

async function mutualCountForViewer(client, viewerId) {
    const result = await client.query(
        `SELECT COUNT(*)::int AS c
         FROM matches m
         JOIN swipes s1 ON s1.swipe_user_id = m.user1_id AND s1.swiped_user_id = m.user2_id AND s1.swipe_type = 'like'
         JOIN swipes s2 ON s2.swipe_user_id = m.user2_id AND s2.swiped_user_id = m.user1_id AND s2.swipe_type = 'like'
         WHERE (m.user1_id = $1 OR m.user2_id = $1)
           AND m.match_status = 'active'`,
        [viewerId]
    );
    return Number(result.rows[0]?.c || 0);
}

async function main() {
    const client = makeClient();
    await client.connect();
    try {
        await client.query("BEGIN");
        const uniq = Date.now();
        const danteId = await insertTempUser(client, `verify_dante_${uniq}@test.com`);
        const averyId = await insertTempUser(client, `verify_avery_${uniq}@test.com`);

        await client.query(
            `INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at)
             VALUES ($1, $2, 'like', NOW())`,
            [averyId, danteId]
        );
        await client.query(
            `INSERT INTO matches (user1_id, user2_id, match_status, matched_at)
             VALUES (LEAST($1::int,$2::int), GREATEST($1::int,$2::int), 'active', NOW())`,
            [danteId, averyId]
        );

        const oneWayCount = await mutualCountForViewer(client, danteId);

        await client.query(
            `INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at)
             VALUES ($1, $2, 'like', NOW())`,
            [danteId, averyId]
        );

        const mutualCount = await mutualCountForViewer(client, danteId);
        await client.query("ROLLBACK");

        console.log(JSON.stringify({
            danteId,
            averyId,
            one_way_like_visible_in_messages: oneWayCount > 0,
            mutual_like_visible_in_messages: mutualCount > 0,
            one_way_count: oneWayCount,
            mutual_count: mutualCount,
        }, null, 2));
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
