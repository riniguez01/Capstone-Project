/**
 * Feature 2 (post-date trust & safety check-in) — dedicated test pair.
 *
 *   node scripts/feature2TestPair.js seed   — create/replace users + mutual match
 *   node scripts/feature2TestPair.js reset  — clear dates, check-ins, trust/moderation state, chat; restore match
 *
 * Logins (both use password: password123):
 *   feature2a@test.com  — Alpha (Woman)
 *   feature2b@test.com  — Beta (Man)
 *
 * Requires DB migration v8 (trust/moderation tables). Loads .env from project root and backend/.env.
 */

const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const PASSWORD_HASH =
    "$2b$10$RIyatva2/Qc33XpWHLrjx.UbEsT4e3Z/E7LdurYh0ECxogjeuW3AS";

const EMAIL_A = "feature2a@test.com";
const EMAIL_B = "feature2b@test.com";

const CHI_LAT = 41.878113;
const CHI_LON = -87.629799;

const MAPS = {
    religion: "religion_type",
    religion_id: "religion_type_id",
    religion_name: "religion_name",
    ethnicity: "ethnicity_type",
    ethnicity_id: "ethnicity_type_id",
    ethnicity_name: "ethnicity_name",
    gender: "gender_type",
    gender_id: "gender_type_id",
    gender_name: "gender_name",
    education: "education_career",
    education_id: "education_career_id",
    education_name: "education_career_name",
    smoking: "smoking",
    smoking_id: "smoking_id",
    smoking_name: "smoking_name",
    drinking: "drinking",
    drinking_id: "drinking_id",
    drinking_name: "drinking_name",
    coffee: "coffee_drinker",
    coffee_id: "coffee_id",
    coffee_name: "coffee_name",
    diet: "diet",
    diet_id: "diet_id",
    diet_name: "diet_name",
    activity: "activity_level",
    activity_id: "activity_level_id",
    activity_name: "activity_name",
    family: "family_oriented",
    family_id: "family_oriented_id",
    family_name: "family_oriented_name",
    music: "music",
    music_id: "music_id",
    music_name: "music_name",
    gamer: "gamer",
    gamer_id: "isgamer_id",
    gamer_name: "isgamer_name",
    reader: "reader",
    reader_id: "isreader_id",
    reader_name: "isreader_name",
    travel: "travel_interest",
    travel_id: "travel_interest_id",
    travel_name: "travel_interest_name",
    pets: "pet_interest",
    pets_id: "pet_interest_id",
    pets_name: "pet_interest_name",
    personality: "personality_type",
    personality_id: "personality_type_id",
    personality_name: "personality_type_name",
    dating_goals: "dating_goals",
    dating_goals_id: "dating_goals_id",
    dating_goal_name: "dating_goal_name",
    astrology: "astrology_sign",
    astrology_id: "astrology_sign_id",
    astrology_name: "astrology_sign",
    children: "want_children",
    children_id: "want_children_id",
    children_name: "want_children",
    political: "political_affil",
    political_id: "political_affil_id",
    political_name: "political_affil",
};

const UI_GENDER_TO_DB = { Male: "Man", Female: "Woman", "Non-binary": "Non-binary" };

const USERS = [
    {
        email: EMAIL_A,
        first_name: "Feature2",
        last_name: "Alpha",
        dob: "1999-06-15",
        gender: "Woman",
        bio: "Feature 2 trust / check-in test (Alpha). Chicago.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 66,
        religion: "Christian",
        ethnicity: "Asian",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Pop",
        gamer: "Casual",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Long-term",
        astrology: "Leo",
        children_own: "Open",
        political: "Moderate",
        trust: 80,
        account_status: "active",
        pref: {
            minAge: 21,
            maxAge: 45,
            minHeight: 58,
            maxHeight: 78,
            min_distance_miles: 0,
            max_distance_miles: 100,
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Male"],
        },
    },
    {
        email: EMAIL_B,
        first_name: "Feature2",
        last_name: "Beta",
        dob: "1998-04-20",
        gender: "Man",
        bio: "Feature 2 trust / check-in test (Beta). Chicago.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 72,
        religion: "Christian",
        ethnicity: "White / Caucasian",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Rock",
        gamer: "Casual",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Long-term",
        astrology: "Aries",
        children_own: "Open",
        political: "Moderate",
        trust: 80,
        account_status: "active",
        pref: {
            minAge: 21,
            maxAge: 45,
            minHeight: 58,
            maxHeight: 78,
            min_distance_miles: 0,
            max_distance_miles: 100,
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Female"],
        },
    },
];

async function loadMap(client, table, idCol, nameCol) {
    const { rows } = await client.query(`SELECT "${idCol}", "${nameCol}" FROM "${table}"`);
    const m = new Map();
    for (const row of rows) m.set(row[nameCol], row[idCol]);
    return m;
}

function must(map, label, ctx) {
    const v = map.get(label);
    if (v === undefined) throw new Error(`Missing lookup ${ctx}: "${label}"`);
    return v;
}

async function deleteUsersAndDeps(client, emails) {
    await client.query(
        `CREATE TEMP TABLE _f2pair ON COMMIT DROP AS
         SELECT user_id FROM users WHERE email = ANY($1::text[])`,
        [emails]
    );
    const { rows } = await client.query(`SELECT user_id FROM _f2pair`);
    if (rows.length === 0) {
        console.log("No existing Feature 2 test users to remove.");
        return;
    }
    console.log(`Removing ${rows.length} existing Feature 2 user(s) and dependencies...`);

    await client.query(
        `DELETE FROM moderation_appeals WHERE user_id IN (SELECT user_id FROM _f2pair)`
    ).catch(() => {});
    await client.query(
        `DELETE FROM moderation_actions WHERE user_id IN (SELECT user_id FROM _f2pair)`
    ).catch(() => {});
    await client.query(
        `DELETE FROM trust_safety_events WHERE subject_user_id IN (SELECT user_id FROM _f2pair)`
    ).catch(() => {});

    await client.query(
        `DELETE FROM post_date_checkin WHERE reviewer_user_id IN (SELECT user_id FROM _f2pair)
            OR reviewed_user_id IN (SELECT user_id FROM _f2pair)`
    );

    const { rows: matchRows } = await client.query(
        `SELECT match_id FROM matches
         WHERE user1_id IN (SELECT user_id FROM _f2pair)
            OR user2_id IN (SELECT user_id FROM _f2pair)`
    );
    const matchIds = matchRows.map((r) => r.match_id);

    if (matchIds.length > 0) {
        await client.query(`DELETE FROM safety_actions WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(
            `DELETE FROM safety_actions WHERE message_id IN (
                SELECT message_id FROM message WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(
            `DELETE FROM post_date_checkin WHERE schedule_id IN (
                SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(
            `DELETE FROM survey_trigger WHERE schedule_id IN (
                SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(`DELETE FROM date_scheduling WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM conversation_safety_state WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM message WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM matches WHERE match_id = ANY($1::int[])`, [matchIds]);
    }

    await client.query(
        `DELETE FROM survey_trigger WHERE user1_id IN (SELECT user_id FROM _f2pair)
            OR user2_id IN (SELECT user_id FROM _f2pair)`
    );
    await client.query(`DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    await client.query(
        `DELETE FROM swipes WHERE swipe_user_id IN (SELECT user_id FROM _f2pair)
            OR swiped_user_id IN (SELECT user_id FROM _f2pair)`
    );
    await client.query(
        `DELETE FROM reports WHERE reported_user_id IN (SELECT user_id FROM _f2pair)
            OR reporter_user_id IN (SELECT user_id FROM _f2pair)`
    );
    await client.query(
        `DELETE FROM blocks WHERE blocker_user_id IN (SELECT user_id FROM _f2pair)
            OR blocked_user_id IN (SELECT user_id FROM _f2pair)`
    );
    await client.query(`DELETE FROM verification WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    await client.query(
        `DELETE FROM moderation WHERE user_id IN (SELECT user_id FROM _f2pair)
            OR admin_id IN (SELECT user_id FROM _f2pair)`
    );
    await client.query(`DELETE FROM photo WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    await client.query(`DELETE FROM trust_score WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    await client.query(`DELETE FROM trust_score_history WHERE user_id IN (SELECT user_id FROM _f2pair)`).catch(() => {});
    await client.query(`DELETE FROM user_availability WHERE user_id IN (SELECT user_id FROM _f2pair)`).catch(() => {});

    await client.query(
        `DELETE FROM preference_genders WHERE preference_id IN (
            SELECT preference_id FROM preferences WHERE user_id IN (SELECT user_id FROM _f2pair)
        )`
    );
    await client.query(`DELETE FROM preferences WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    await client.query(`DELETE FROM users WHERE user_id IN (SELECT user_id FROM _f2pair)`);
    console.log("Old Feature 2 users removed.");
}

async function insertUser(client, u, lookup, languageId) {
    const religion = lookup.religion;
    const ethnicity = lookup.ethnicity;
    const gender = lookup.gender;
    const education = lookup.education;
    const smoking = lookup.smoking;
    const drinking = lookup.drinking;
    const coffee = lookup.coffee;
    const diet = lookup.diet;
    const activity = lookup.activity;
    const family = lookup.family;
    const music = lookup.music;
    const gamer = lookup.gamer;
    const reader = lookup.reader;
    const travel = lookup.travel;
    const pets = lookup.pets;
    const personality = lookup.personality;
    const datingGoals = lookup.datingGoals;
    const astrology = lookup.astrology;
    const children = lookup.children;
    const political = lookup.political;

    const gid = must(gender, u.gender, "gender");
    const insertUserSql = `
        INSERT INTO users (
            first_name, last_name, email, password_hash,
            date_of_birth, gender_identity,
            bio, profile_photo_url, location_city, location_state,
            latitude, longitude, account_status, created_at, last_login,
            height_inches, religion_id, role_id, tier_id,
            ethnicity_id, language_id, education_career_id,
            smoking_id, drinking_id, coffee_id, diet_id,
            activity_level, family_oriented, music,
            gamer, reader, travel, pet_interest,
            personality_type, dating_goals, looking_for,
            astrology, children, political
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW(),
            $14,$15,1,1,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
        ) RETURNING user_id
    `;
    const { rows: urows } = await client.query(insertUserSql, [
        u.first_name,
        u.last_name,
        u.email,
        PASSWORD_HASH,
        u.dob,
        gid,
        u.bio,
        null,
        u.city,
        u.state,
        u.lat,
        u.lon,
        u.account_status,
        u.height_inches,
        must(religion, u.religion, "religion"),
        must(ethnicity, u.ethnicity, "ethnicity"),
        languageId,
        must(education, u.education, "education"),
        must(smoking, u.smoker, "smoking"),
        must(drinking, u.drinker, "drinking"),
        must(coffee, u.coffee, "coffee"),
        must(diet, u.diet, "diet"),
        must(activity, u.activity, "activity"),
        must(family, u.family_own, "family"),
        must(music, u.music, "music"),
        must(gamer, u.gamer, "gamer"),
        must(reader, u.reader, "reader"),
        must(travel, u.travel, "travel"),
        must(pets, u.pets, "pets"),
        must(personality, u.personality, "personality"),
        must(datingGoals, u.dating_goal, "dating_goal"),
        u.bio.slice(0, 120),
        must(astrology, u.astrology, "astrology"),
        must(children, u.children_own, "children"),
        must(political, u.political, "political"),
    ]);
    const userId = urows[0].user_id;

    await client.query(
        `INSERT INTO trust_score (user_id, internal_score, last_updated)
         VALUES ($1, $2, NOW())`,
        [userId, u.trust]
    );

    const p = u.pref;
    const prefRel = p.religion ? must(religion, p.religion, "pref.religion") : null;
    const prefEth = p.ethnicity ? must(ethnicity, p.ethnicity, "pref.ethnicity") : null;
    const prefPol = p.political ? must(political, p.political, "pref.political") : null;
    const prefChild = p.children ? must(children, p.children, "pref.children") : null;
    const prefDate = p.dating_goal ? must(datingGoals, p.dating_goal, "pref.dating_goal") : null;
    const prefAct = p.activity ? must(activity, p.activity, "pref.activity") : null;
    const prefFam = p.family ? must(family, p.family, "pref.family") : null;

    const { rows: prow } = await client.query(
        `INSERT INTO preferences (
            user_id,
            preferred_age_min, preferred_age_max,
            min_distance_miles, max_distance_miles,
            preferred_height_min, preferred_height_max,
            preferred_religion_type_id, preferred_ethnicity_id,
            preferred_political_affil, preferred_want_children,
            preferred_dating_goals, preferred_activity_level, preferred_family_oriented
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING preference_id`,
        [
            userId,
            p.minAge,
            p.maxAge,
            p.min_distance_miles,
            p.max_distance_miles,
            p.minHeight,
            p.maxHeight,
            prefRel,
            prefEth,
            prefPol,
            prefChild,
            prefDate,
            prefAct,
            prefFam,
        ]
    );
    const preferenceId = prow[0].preference_id;

    if (p.genderPrefs && p.genderPrefs.length > 0) {
        for (const gLabel of p.genderPrefs) {
            const dbName = UI_GENDER_TO_DB[gLabel] || gLabel;
            const gidPref = must(gender, dbName, "pref.gender");
            await client.query(
                `INSERT INTO preference_genders (preference_id, gender_type_id)
                 VALUES ($1, $2)
                 ON CONFLICT (preference_id, gender_type_id) DO NOTHING`,
                [preferenceId, gidPref]
            );
        }
    }

    return userId;
}

async function ensureMutualMatchSafe(client, idA, idB) {
    await client.query(
        `DELETE FROM swipes
         WHERE (swipe_user_id = $1 AND swiped_user_id = $2)
            OR (swipe_user_id = $2 AND swiped_user_id = $1)`,
        [idA, idB]
    );
    await client.query(
        `INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at)
         VALUES ($1, $2, 'like', NOW()), ($2, $1, 'like', NOW())`,
        [idA, idB]
    );
    const u1 = Math.min(idA, idB);
    const u2 = Math.max(idA, idB);
    await client.query(
        `INSERT INTO matches (user1_id, user2_id, match_status, matched_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (user1_id, user2_id) DO UPDATE SET
            match_status = 'active',
            matched_at = NOW()`,
        [u1, u2]
    );
    const { rows } = await client.query(
        `SELECT match_id FROM matches WHERE user1_id = $1 AND user2_id = $2`,
        [u1, u2]
    );
    return rows[0]?.match_id ?? null;
}

async function getUserIdsByEmail(client) {
    const { rows } = await client.query(
        `SELECT user_id, email FROM users WHERE email IN ($1, $2)`,
        [EMAIL_A, EMAIL_B]
    );
    return rows;
}

async function clearMatchDataOnly(client, idA, idB) {
    const u1 = Math.min(idA, idB);
    const u2 = Math.max(idA, idB);

    const { rows: mr } = await client.query(
        `SELECT match_id FROM matches WHERE user1_id = $1 AND user2_id = $2`,
        [u1, u2]
    );
    if (mr.length === 0) {
        console.log("No match row between Feature 2 users — will recreate.");
        return;
    }
    const matchId = mr[0].match_id;

    const scheduleRows = await client.query(`SELECT schedule_id FROM date_scheduling WHERE match_id = $1`, [matchId]);
    const scheduleIds = scheduleRows.rows.map((r) => r.schedule_id);
    if (scheduleIds.length > 0) {
        await client.query(`DELETE FROM post_date_checkin WHERE schedule_id = ANY($1::int[])`, [scheduleIds]);
        await client.query(`DELETE FROM survey_trigger WHERE schedule_id = ANY($1::int[])`, [scheduleIds]);
    }
    await client.query(`DELETE FROM date_scheduling WHERE match_id = $1`, [matchId]);
    await client.query(`DELETE FROM notifications WHERE user_id IN ($1, $2)`, [idA, idB]);
    await client.query(`DELETE FROM safety_actions WHERE match_id = $1`, [matchId]).catch(() => {});
    await client.query(`DELETE FROM conversation_safety_state WHERE match_id = $1`, [matchId]);
    await client.query(`DELETE FROM message WHERE match_id = $1`, [matchId]);
    await client.query(`DELETE FROM matches WHERE match_id = $1`, [matchId]);
    await client.query(
        `DELETE FROM swipes
         WHERE (swipe_user_id = $1 AND swiped_user_id = $2)
            OR (swipe_user_id = $2 AND swiped_user_id = $1)`,
        [idA, idB]
    );
    console.log(`Cleared match_id=${matchId} data (messages, safety state, swipes).`);
}

/** Reset trust scores and Feature 2 moderation rows so you can re-run check-in scenarios. */
async function resetFeature2TrustState(client, idA, idB) {
    await client.query(`DELETE FROM trust_score_history WHERE user_id IN ($1, $2)`, [idA, idB]).catch(() => {});
    await client.query(`DELETE FROM moderation_appeals WHERE user_id IN ($1, $2)`, [idA, idB]).catch(() => {});
    await client.query(`DELETE FROM moderation_actions WHERE user_id IN ($1, $2)`, [idA, idB]).catch(() => {});
    await client.query(`DELETE FROM trust_safety_events WHERE subject_user_id IN ($1, $2)`, [idA, idB]).catch(() => {});

    try {
        await client.query(
            `UPDATE trust_score SET
                internal_score = 75,
                public_trust_rating = NULL,
                last_updated = NOW(),
                trust_frozen_until = NULL,
                freeze_reason = NULL
             WHERE user_id IN ($1, $2)`,
            [idA, idB]
        );
    } catch {
        await client.query(
            `UPDATE trust_score SET internal_score = 75, last_updated = NOW() WHERE user_id IN ($1, $2)`,
            [idA, idB]
        );
    }

    try {
        await client.query(
            `UPDATE users SET
                trust_public_dates_only = false,
                trust_matching_restricted = false,
                premium_suspended = false,
                visibility_rank_penalty = 0,
                moderation_warning_logged = false
             WHERE user_id IN ($1, $2)`,
            [idA, idB]
        );
    } catch {
        /* older schema without v8 user columns */
    }

    console.log("Reset trust_score + moderation flags for Feature 2 test users.");
}

async function cmdSeed() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    await client.connect();

    const religion = await loadMap(client, MAPS.religion, MAPS.religion_id, MAPS.religion_name);
    const ethnicity = await loadMap(client, MAPS.ethnicity, MAPS.ethnicity_id, MAPS.ethnicity_name);
    const gender = await loadMap(client, MAPS.gender, MAPS.gender_id, MAPS.gender_name);
    const education = await loadMap(client, MAPS.education, MAPS.education_id, MAPS.education_name);
    const smoking = await loadMap(client, MAPS.smoking, MAPS.smoking_id, MAPS.smoking_name);
    const drinking = await loadMap(client, MAPS.drinking, MAPS.drinking_id, MAPS.drinking_name);
    const coffee = await loadMap(client, MAPS.coffee, MAPS.coffee_id, MAPS.coffee_name);
    const diet = await loadMap(client, MAPS.diet, MAPS.diet_id, MAPS.diet_name);
    const activity = await loadMap(client, MAPS.activity, MAPS.activity_id, MAPS.activity_name);
    const family = await loadMap(client, MAPS.family, MAPS.family_id, MAPS.family_name);
    const music = await loadMap(client, MAPS.music, MAPS.music_id, MAPS.music_name);
    const gamer = await loadMap(client, MAPS.gamer, MAPS.gamer_id, MAPS.gamer_name);
    const reader = await loadMap(client, MAPS.reader, MAPS.reader_id, MAPS.reader_name);
    const travel = await loadMap(client, MAPS.travel, MAPS.travel_id, MAPS.travel_name);
    const pets = await loadMap(client, MAPS.pets, MAPS.pets_id, MAPS.pets_name);
    const personality = await loadMap(client, MAPS.personality, MAPS.personality_id, MAPS.personality_name);
    const datingGoals = await loadMap(client, MAPS.dating_goals, MAPS.dating_goals_id, MAPS.dating_goal_name);
    const astrology = await loadMap(client, MAPS.astrology, MAPS.astrology_id, MAPS.astrology_name);
    const children = await loadMap(client, MAPS.children, MAPS.children_id, MAPS.children_name);
    const political = await loadMap(client, MAPS.political, MAPS.political_id, MAPS.political_name);

    const lookup = {
        religion,
        ethnicity,
        gender,
        education,
        smoking,
        drinking,
        coffee,
        diet,
        activity,
        family,
        music,
        gamer,
        reader,
        travel,
        pets,
        personality,
        datingGoals,
        astrology,
        children,
        political,
    };

    const langResult = await client.query(
        `SELECT language_type_id FROM language WHERE language_name = 'English' LIMIT 1`
    );
    const languageId = langResult.rows[0]?.language_type_id;
    if (!languageId) throw new Error("language 'English' not found");

    try {
        await client.query("BEGIN");
        await deleteUsersAndDeps(client, [EMAIL_A, EMAIL_B]);

        const ids = [];
        for (const u of USERS) {
            const uid = await insertUser(client, u, lookup, languageId);
            ids.push(uid);
            console.log(`Created ${u.email} → user_id=${uid}`);
        }

        const matchId = await ensureMutualMatchSafe(client, ids[0], ids[1]);
        await client.query("COMMIT");
        printSuccess(matchId, ids[0], ids[1]);
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        await client.end();
    }
}

async function cmdReset() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    await client.connect();

    try {
        const rows = await getUserIdsByEmail(client);
        if (rows.length < 2) {
            console.error(
                "Feature 2 test users not found. Run:  node scripts/feature2TestPair.js seed"
            );
            process.exit(1);
        }
        const byEmail = Object.fromEntries(rows.map((r) => [r.email, r.user_id]));
        const idA = byEmail[EMAIL_A];
        const idB = byEmail[EMAIL_B];
        if (!idA || !idB) {
            console.error("Missing one of the Feature 2 emails. Run seed first.");
            process.exit(1);
        }

        await client.query("BEGIN");
        await resetFeature2TrustState(client, idA, idB);
        await clearMatchDataOnly(client, idA, idB);
        const matchId = await ensureMutualMatchSafe(client, idA, idB);
        await client.query("COMMIT");
        printSuccess(matchId, idA, idB);
    } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
    } finally {
        await client.end();
    }
}

function printSuccess(matchId, idA, idB) {
    console.log("");
    console.log("── Feature 2 test pair ─────────────────────────────");
    console.log(`  ${EMAIL_A}  /  user_id ${idA}`);
    console.log(`  ${EMAIL_B}  /  user_id ${idB}`);
    console.log(`  Password (both):  password123`);
    if (matchId) console.log(`  match_id:         ${matchId}`);
    console.log("");
    console.log("  After reset: restart backend so survey cron + any in-memory state is fresh.");
    console.log("────────────────────────────────────────────────────");
}

const cmd = process.argv[2];
if (cmd === "seed") {
    cmdSeed().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
} else if (cmd === "reset") {
    cmdReset().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
} else {
    console.error("Usage:  node scripts/feature2TestPair.js seed | reset");
    process.exit(1);
}
