/**
 * Audit all @test.com / @aura.demo users: full prefs + ranked matches using the
 * same code path as the API (getUserById → getCandidates → generateMatches).
 *
 * Hard deck filters (see backend/matching/filterMatches.js): active account,
 * trust_score > 40, mutual preferred genders, age/height bands, distance min/max.
 * Religion/ethnicity/dating goals/etc. affect score only (soft), not inclusion.
 *
 * Usage (from repo root, with DB_* in .env or backend/.env):
 *   node scripts/auditTestUserMatches.js
 *   node scripts/auditTestUserMatches.js --top 10
 *
 * --top N limits how many overall ranked rows to print per user (default 15).
 */

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const pool = require("../backend/config/db");
const { getUserById, getCandidates } = require("../backend/services/userService");
const generateMatches = require("../backend/services/matchingService");

function parseArgs() {
    const argv = process.argv.slice(2);
    let top = 15;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--top" && argv[i + 1]) {
            top = Math.max(1, parseInt(argv[i + 1], 10) || 15);
            i++;
        }
    }
    return { top };
}

function fmtHeight(inches) {
    if (inches == null || inches === "") return "—";
    const n = Number(inches);
    if (!Number.isFinite(n)) return "—";
    const ft = Math.floor(n / 12);
    const inch = Math.round(n % 12);
    return `${ft}'${inch}"`;
}

function ageFromDob(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function formatPrefs(p) {
    if (!p) return ["  (no preferences row)"];
    const lines = [];
    lines.push(
        `  Age            : ${p.preferred_age_min ?? "—"} – ${p.preferred_age_max ?? "—"}`
    );
    lines.push(
        `  Height         : ${fmtHeight(p.preferred_height_min)} – ${fmtHeight(p.preferred_height_max)}`
    );
    lines.push(
        `  Distance (mi)  : min ${p.min_distance_miles ?? "—"}  max ${p.max_distance_miles ?? "—"}`
    );
    const g = Array.isArray(p.preferred_genders)
        ? p.preferred_genders.join(", ")
        : "—";
    lines.push(`  Gender IDs     : ${g}`);
    lines.push(`  Religion pref  : ${p.preferred_religion_label ?? "—"}`);
    lines.push(`  Ethnicity pref : ${p.preferred_ethnicity_label ?? "—"}`);
    lines.push(`  Dating goal    : ${p.preferred_dating_goals_label ?? "—"}`);
    lines.push(`  Children pref  : ${p.preferred_want_children_label ?? "—"}`);
    lines.push(`  Political pref : ${p.preferred_political_label ?? "—"}`);
    lines.push(`  Family pref    : ${p.preferred_family_oriented_label ?? "—"}`);
    return lines;
}

function printUserBlock(user, genderMap) {
    const p = user.preferences;
    const gname = user.gender_name || "—";
    const prefG =
        p && Array.isArray(p.preferred_genders)
            ? p.preferred_genders.map((id) => genderMap[id] || String(id)).join(", ")
            : "—";

    console.log("─".repeat(72));
    console.log(
        `USER #${user.user_id}  ${user.first_name || "?"} ${user.last_name || "?"}  <${user.email || "?"}>`
    );
    console.log(`  Status / tier  : ${user.account_status} / tier ${user.tier_id ?? "—"}`);
    console.log(`  Trust (internal): ${user.trust_score ?? "—"}`);
    console.log(`  Gender         : ${gname}`);
    console.log(`  DOB / age      : ${user.date_of_birth || "—"} (${ageFromDob(user.date_of_birth) ?? "—"})`);
    console.log(`  Height         : ${fmtHeight(user.height_inches)}`);
    console.log(
        `  Location       : ${user.location_city || "—"}, ${user.location_state || "—"}  (${user.latitude ?? "?"}, ${user.longitude ?? "?"})`
    );
    console.log(`  Religion / eth : ${user.religion_name || "—"} / ${user.ethnicity_name || "—"}`);
    console.log(`  Dating goal    : ${user.dating_goals_name || "—"}`);
    console.log(`  Children       : ${user.children_name || "—"}`);
    console.log(`  Political      : ${user.political_name || "—"}`);

    console.log("\n  ── PREFERENCES (stored) ──");
    formatPrefs(p).forEach((line) => console.log(line));
    console.log(`  Pref genders (names): ${prefG}`);
}

function printMatchesForUser(user, matches, candidateByUserId, testIdSet, top) {
    const slice = matches.slice(0, top);
    const testOnly = matches.filter((m) => testIdSet.has(m.user_id));

    console.log("\n  ── MATCHES (same algorithm as GET /matches) ──");
    console.log(
        `  Pool: ${matches.length} passed filters & ranked  |  Test users in stack: ${testOnly.length}`
    );

    if (slice.length === 0) {
        console.log("  (no matches — check prefs, distance, trust ≤40, inactive accounts, or gender mismatch)");
        return;
    }

    console.log(`  Top ${slice.length} (showing up to --top):`);
    slice.forEach((m, idx) => {
        const c = candidateByUserId.get(String(m.user_id));
        const email = c?.email || "?";
        const name = c ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : "?";
        const tag = testIdSet.has(m.user_id) ? "[test]" : "[non-test]";
        console.log(
            `    ${idx + 1}. #${m.user_id} ${tag} ${name} <${email}>  score=${m.score} raw=${m.raw_score}${m.trust_penalized ? " trust_penalized" : ""}`
        );
    });

    if (testOnly.length > 0) {
        console.log("  All test-user matches (rank order):");
        testOnly.forEach((m, idx) => {
            const c = candidateByUserId.get(String(m.user_id));
            const email = c?.email || "?";
            const name = c ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : "?";
            console.log(
                `    ${idx + 1}. #${m.user_id} ${name} <${email}>  score=${m.score}`
            );
        });
    }
}

async function loadGenderMap() {
    const { rows } = await pool.query(
        "SELECT gender_type_id, gender_name FROM gender_type ORDER BY gender_type_id"
    );
    const map = {};
    for (const r of rows) map[r.gender_type_id] = r.gender_name;
    return map;
}

async function main() {
    const { top } = parseArgs();

    const { rows: testRows } = await pool.query(`
        SELECT user_id, email, first_name, last_name
        FROM users
        WHERE email ILIKE '%@test.com' OR email ILIKE '%@aura.demo'
        ORDER BY email
    `);

    if (testRows.length === 0) {
        console.log("No test users found (@test.com / @aura.demo).");
        await pool.end();
        return;
    }

    const testIdSet = new Set(testRows.map((r) => r.user_id));
    const genderMap = await loadGenderMap();

    console.log("=".repeat(72));
    console.log(
        `Audit: ${testRows.length} test users  |  Hard filters: trust>40, active, mutual gender prefs, age, height, distance`
    );
    console.log("=".repeat(72));

    for (const row of testRows) {
        const user = await getUserById(row.user_id);
        if (!user) {
            console.log(`\nSkipping missing user_id ${row.user_id}`);
            continue;
        }

        printUserBlock(user, genderMap);

        const candidates = await getCandidates(user.user_id);
        const { matches, candidateByUserId } = await generateMatches(user, candidates);
        printMatchesForUser(user, matches, candidateByUserId, testIdSet, top);
        console.log("");
    }

    await pool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
