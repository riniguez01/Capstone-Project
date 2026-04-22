const path = require("path");
const axios = require("axios");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

function apiGender(genderName, userId) {
    const g = String(genderName || "").trim();
    if (g === "Woman") return "female";
    if (g === "Man") return "male";
    return Number(userId) % 2 === 0 ? "male" : "female";
}

async function portraitUrlFor(genderName, userId) {
    const gender = apiGender(genderName, userId);
    const seed = `assign-test-${userId}`;
    try {
        const { data } = await axios.get("https://randomuser.me/api/", {
            params: { gender, seed, nat: "us", n: 1 },
            timeout: 20000,
        });
        const large = data && data.results && data.results[0] && data.results[0].picture && data.results[0].picture.large;
        if (large) {
            return String(large).trim();
        }
    } catch {
    }
    const folder = gender === "female" ? "women" : "men";
    const idx = Math.abs(Number(userId) * 7919) % 100;
    return `https://randomuser.me/api/portraits/${folder}/${idx}.jpg`;
}

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    await client.connect();
    let ok = 0;
    let failed = 0;
    try {
        const { rows } = await client.query(
            `SELECT u.user_id, gt.gender_name
             FROM users u
             LEFT JOIN gender_type gt ON gt.gender_type_id = u.gender_identity
             WHERE u.email ILIKE '%@test.com' OR u.email ILIKE '%@aura.demo'
             ORDER BY u.user_id`
        );
        for (const row of rows) {
            try {
                const url = await portraitUrlFor(row.gender_name, row.user_id);
                await client.query("BEGIN");
                await client.query("UPDATE users SET profile_photo_url = $1 WHERE user_id = $2", [url, row.user_id]);
                const ph = await client.query("SELECT 1 FROM photo WHERE user_id = $1 LIMIT 1", [row.user_id]);
                if (ph.rows.length === 0) {
                    await client.query(
                        `INSERT INTO photo (user_id, photo_url, is_primary, uploaded_at) VALUES ($1, $2, true, NOW())`,
                        [row.user_id, url]
                    );
                }
                await client.query("COMMIT");
                ok += 1;
            } catch {
                await client.query("ROLLBACK").catch(() => {});
                failed += 1;
            }
        }
    } finally {
        await client.end();
    }
    if (failed > 0) {
        process.exitCode = 1;
    }
    console.log(`Profile photos assigned: ${ok} ok, ${failed} failed.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
