/**
 * Feature 1 (matching) — single live-demo reset for curated accounts.
 *
 * Clears swipes, matches, messages, and related interaction rows for users whose email
 * ends with @test.com or @aura.demo (same scope as scripts/seedCapstoneDemoUsers.js).
 * Does not delete users, preferences, trust scores, or photos. For a full DB rebuild
 * of demo users, use npm run db:seed:demo instead.
 *
 * From repo root (loads .env then backend/.env):
 *   npm run db:reset:demo
 *
 * Options:
 *   --dry-run    print what would be affected; no deletes
 *   --no-repair  skip database/repair_curated_capstone_partner_preferences.sql
 *
 * After a successful reset (unless --no-repair), runs the repair SQL so partner prefs
 * match the seeded roster (e.g. mutual gender stacks for the demo viewers).
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const DRY = process.argv.includes("--dry-run");
const SKIP_REPAIR = process.argv.includes("--no-repair");

const REPAIR_CURATED_PREFS_SQL = path.join(
    __dirname,
    "..",
    "database",
    "repair_curated_capstone_partner_preferences.sql"
);

async function repairCuratedDemoPartnerPrefs(client) {
    if (!fs.existsSync(REPAIR_CURATED_PREFS_SQL)) {
        console.warn("  (skip curated prefs repair: missing database/repair_curated_capstone_partner_preferences.sql)");
        return;
    }
    const sql = fs.readFileSync(REPAIR_CURATED_PREFS_SQL, "utf8");
    await client.query(sql);
    console.log("  Curated demo partner preferences + preference_genders restored (matches seed roster).");
}

async function optionalDelete(client, label, sql, params = []) {
    try {
        const r = await client.query(sql, params);
        return r.rowCount;
    } catch (e) {
        if (e.code === "42P01") {
            console.warn(`  (skip ${label}: table not in this database)`);
            return 0;
        }
        throw e;
    }
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

    const scopeSubquery = `
        SELECT user_id FROM users
        WHERE email ILIKE '%@test.com' OR email ILIKE '%@aura.demo'
    `;

    try {
        const { rows: idRows } = await client.query(scopeSubquery);
        if (idRows.length === 0) {
            console.log("No users matched @test.com / @aura.demo — nothing to do.");
            return;
        }

        if (DRY) {
            const swipes = await client.query(
                `SELECT COUNT(*)::int AS c FROM swipes
                 WHERE swipe_user_id IN (${scopeSubquery}) OR swiped_user_id IN (${scopeSubquery})`
            );
            console.log("[dry-run] Demo user ids in scope:", idRows.length);
            console.log("[dry-run] swipes:", swipes.rows[0].c);
            const matches = await client.query(
                `SELECT COUNT(*)::int AS c FROM matches
                 WHERE user1_id IN (${scopeSubquery}) OR user2_id IN (${scopeSubquery})`
            );
            const msgs = await client.query(
                `SELECT COUNT(*)::int AS c FROM message
                 WHERE match_id IN (
                   SELECT match_id FROM matches
                   WHERE user1_id IN (${scopeSubquery}) OR user2_id IN (${scopeSubquery})
                 )`
            );
            console.log("[dry-run] matches:", matches.rows[0].c, "messages (for those matches):", msgs.rows[0].c);
            console.log("[dry-run] Full reset would also delete notifications, reports, blocks, and match-related rows.");
            return;
        }

        await client.query("BEGIN");

        const log = (label, n) => {
            if (n > 0) console.log(`  ${label}: ${n}`);
        };

        // Orphan checkins referencing demo users (before match cleanup)
        log(
            "post_date_checkin (by user)",
            (
                await client.query(
                    `DELETE FROM post_date_checkin
                     WHERE reviewer_user_id IN (${scopeSubquery})
                        OR reviewed_user_id IN (${scopeSubquery})`
                )
            ).rowCount
        );

        const { rows: matchRows } = await client.query(
            `SELECT match_id FROM matches
             WHERE user1_id IN (${scopeSubquery}) OR user2_id IN (${scopeSubquery})`
        );
        const matchIds = matchRows.map((r) => r.match_id);

        if (matchIds.length > 0) {
            log(
                "safety_actions (by match)",
                (await client.query(`DELETE FROM safety_actions WHERE match_id = ANY($1::int[])`, [matchIds]))
                    .rowCount
            );
            log(
                "safety_actions (by message)",
                (
                    await client.query(
                        `DELETE FROM safety_actions WHERE message_id IN (
                            SELECT message_id FROM message WHERE match_id = ANY($1::int[])
                        )`,
                        [matchIds]
                    )
                ).rowCount
            );
            log(
                "post_date_checkin (by schedule)",
                (
                    await client.query(
                        `DELETE FROM post_date_checkin WHERE schedule_id IN (
                            SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
                        )`,
                        [matchIds]
                    )
                ).rowCount
            );
            log(
                "survey_trigger (by schedule)",
                (
                    await client.query(
                        `DELETE FROM survey_trigger WHERE schedule_id IN (
                            SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
                        )`,
                        [matchIds]
                    )
                ).rowCount
            );
            log(
                "date_scheduling",
                (await client.query(`DELETE FROM date_scheduling WHERE match_id = ANY($1::int[])`, [matchIds]))
                    .rowCount
            );
            log(
                "conversation_safety_state",
                (await client.query(`DELETE FROM conversation_safety_state WHERE match_id = ANY($1::int[])`, [matchIds]))
                    .rowCount
            );
            log(
                "message",
                (await client.query(`DELETE FROM message WHERE match_id = ANY($1::int[])`, [matchIds])).rowCount
            );
            log(
                "matches",
                (await client.query(`DELETE FROM matches WHERE match_id = ANY($1::int[])`, [matchIds])).rowCount
            );
        }

        log(
            "survey_trigger (by user pair)",
            (
                await client.query(
                    `DELETE FROM survey_trigger
                     WHERE user1_id IN (${scopeSubquery}) OR user2_id IN (${scopeSubquery})`
                )
            ).rowCount
        );

        log(
            "notifications",
            await optionalDelete(
                client,
                "notifications",
                `DELETE FROM notifications WHERE user_id IN (${scopeSubquery})`
            )
        );

        log(
            "swipes",
            (
                await client.query(
                    `DELETE FROM swipes
                     WHERE swipe_user_id IN (${scopeSubquery})
                        OR swiped_user_id IN (${scopeSubquery})`
                )
            ).rowCount
        );

        log(
            "reports",
            (
                await client.query(
                    `DELETE FROM reports
                     WHERE reported_user_id IN (${scopeSubquery})
                        OR reporter_user_id IN (${scopeSubquery})`
                )
            ).rowCount
        );

        log(
            "blocks",
            (
                await client.query(
                    `DELETE FROM blocks
                     WHERE blocker_user_id IN (${scopeSubquery})
                        OR blocked_user_id IN (${scopeSubquery})`
                )
            ).rowCount
        );

        log(
            "user_availability",
            await optionalDelete(
                client,
                "user_availability",
                `DELETE FROM user_availability WHERE user_id IN (${scopeSubquery})`
            )
        );

        await client.query("COMMIT");
        if (!SKIP_REPAIR) {
            await repairCuratedDemoPartnerPrefs(client);
        }
        console.log(`Demo interaction reset complete (${idRows.length} user(s) in scope).`);
        console.log(
            SKIP_REPAIR
                ? "Profiles, trust scores, and photos were not modified (preferences unchanged — use default repair or npm run db:repair:curated-prefs if stacks look wrong)."
                : "Trust scores and photos were not modified; curated demo partner preferences were aligned with the seed roster."
        );
    } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
