const path = require("path");
const axios = require("axios");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
const PEXELS_PER_PAGE = 80;

const searchCache = new Map();

function searchQueryForGender(genderName, userId) {
    const g = String(genderName || "").trim();
    if (g === "Man") return "man portrait";
    if (g === "Woman" || g === "Non-binary" || g === "Nonbinary") return "woman portrait";
    return Number(userId) % 2 === 0 ? "man portrait" : "woman portrait";
}

function assertPexelsApiKey() {
    const apiKey = String(process.env.PEXELS_API_KEY || "").trim();
    if (!apiKey) {
        throw new Error("Missing PEXELS_API_KEY. Add it to .env and backend/.env before running photo assignment.");
    }
    return apiKey;
}

async function fetchPexelsPage(apiKey, query, page) {
    const key = `${query}::${page}`;
    if (searchCache.has(key)) {
        return searchCache.get(key);
    }

    const { data } = await axios.get(PEXELS_ENDPOINT, {
        params: { query, page, per_page: PEXELS_PER_PAGE },
        headers: { Authorization: apiKey },
        timeout: 20000,
    });
    searchCache.set(key, data);
    return data;
}

async function portraitUrlFor(apiKey, genderName, userId) {
    const query = searchQueryForGender(genderName, userId);
    const firstPage = await fetchPexelsPage(apiKey, query, 1);
    const totalResults = Number(firstPage?.total_results || 0);
    if (!totalResults) {
        throw new Error(`No Pexels photos found for query "${query}".`);
    }

    const deterministicIndex = Number(userId) % totalResults;
    const targetPage = Math.floor(deterministicIndex / PEXELS_PER_PAGE) + 1;
    const indexInPage = deterministicIndex % PEXELS_PER_PAGE;
    const pagePayload = targetPage === 1 ? firstPage : await fetchPexelsPage(apiKey, query, targetPage);
    const photos = Array.isArray(pagePayload?.photos) ? pagePayload.photos : [];
    const chosen = photos[indexInPage];
    const largeUrl = chosen?.src?.large;
    if (!largeUrl) {
        throw new Error(`Missing src.large for user_id ${userId} (query "${query}", index ${deterministicIndex}).`);
    }
    return String(largeUrl).trim();
}

async function main() {
    const pexelsApiKey = assertPexelsApiKey();
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
                const url = await portraitUrlFor(pexelsApiKey, row.gender_name, row.user_id);
                await client.query("BEGIN");
                await client.query("UPDATE users SET profile_photo_url = $1 WHERE user_id = $2", [url, row.user_id]);
                const ph = await client.query(
                    "SELECT photo_id FROM photo WHERE user_id = $1 AND is_primary = true LIMIT 1",
                    [row.user_id]
                );
                if (ph.rows.length === 0) {
                    await client.query(
                        `INSERT INTO photo (user_id, photo_url, is_primary, uploaded_at) VALUES ($1, $2, true, NOW())`,
                        [row.user_id, url]
                    );
                } else {
                    await client.query(
                        `UPDATE photo
                         SET photo_url = $2, uploaded_at = NOW()
                         WHERE user_id = $1 AND is_primary = true`,
                        [row.user_id, url]
                    );
                }
                await client.query("COMMIT");
                ok += 1;
            } catch (e) {
                await client.query("ROLLBACK").catch(() => {});
                failed += 1;
                console.warn(`Photo assignment failed for user_id ${row.user_id}: ${e.message}`);
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

module.exports = { main };

if (require.main === module) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
