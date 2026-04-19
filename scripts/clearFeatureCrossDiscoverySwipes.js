const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const FEATURE_CROSS_EMAILS = [
    "feature2a@test.com",
    "feature2b@test.com",
    "feature3a@test.com",
    "feature3b@test.com",
    "tyler@test.com",
];

async function clearFeatureCrossDiscoverySwipes(client) {
    const { rows } = await client.query(
        `SELECT user_id, email FROM users WHERE email = ANY($1::text[])`,
        [FEATURE_CROSS_EMAILS]
    );
    if (rows.length === 0) return 0;
    const byEmail = Object.fromEntries(rows.map((r) => [r.email, r.user_id]));
    const f2a = byEmail["feature2a@test.com"] ?? null;
    const f2b = byEmail["feature2b@test.com"] ?? null;
    const f3a = byEmail["feature3a@test.com"] ?? null;
    const f3b = byEmail["feature3b@test.com"] ?? null;
    const ids = rows.map((r) => r.user_id);

    const del = await client.query(
        `DELETE FROM swipes s
         WHERE (s.swipe_user_id = ANY($1::int[]) OR s.swiped_user_id = ANY($1::int[]))
           AND NOT (
             s.swipe_type = 'like'
             AND (
               ($2::int IS NOT NULL AND $3::int IS NOT NULL
                 AND s.swipe_user_id = $2 AND s.swiped_user_id = $3)
               OR ($2::int IS NOT NULL AND $3::int IS NOT NULL
                 AND s.swipe_user_id = $3 AND s.swiped_user_id = $2)
               OR ($4::int IS NOT NULL AND $5::int IS NOT NULL
                 AND s.swipe_user_id = $4 AND s.swiped_user_id = $5)
               OR ($4::int IS NOT NULL AND $5::int IS NOT NULL
                 AND s.swipe_user_id = $5 AND s.swiped_user_id = $4)
             )
           )`,
        [ids, f2a, f2b, f3a, f3b]
    );
    return del.rowCount;
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
        const n = await clearFeatureCrossDiscoverySwipes(client);
        await client.query("COMMIT");
        console.log(`Deleted ${n} swipe row(s) (feature2/feature3/Tyler cross-discovery cleanup).`);
    } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}

module.exports = { clearFeatureCrossDiscoverySwipes, FEATURE_CROSS_EMAILS };
