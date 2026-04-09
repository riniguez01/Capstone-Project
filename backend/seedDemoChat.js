require("dotenv").config();
const pool   = require("./config/db");
const bcrypt = require("bcrypt");

async function getOrCreateUser(firstName, lastName, email, hash, dob, genderIdentity, city, state, bio, extraFields) {
    const existing = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
        console.log(`  ${firstName} already exists — user_id: ${existing.rows[0].user_id}`);
        return existing.rows[0].user_id;
    }
    const result = await pool.query(
        `INSERT INTO users
            (first_name, last_name, email, password_hash, date_of_birth,
             gender_identity, location_city, location_state, bio,
             account_status, created_at, role_id, tier_id,
             religion_id, activity_level, music, personality_type,
             dating_goals, children, drinking_id, smoking_id, diet_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',NOW(),1,1,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING user_id`,
        [firstName, lastName, email, hash, dob, genderIdentity, city, state, bio,
            extraFields.religion_id, extraFields.activity_level, extraFields.music,
            extraFields.personality_type, extraFields.dating_goals, extraFields.children,
            extraFields.drinking_id, extraFields.smoking_id, extraFields.diet_id]
    );
    return result.rows[0].user_id;
}

async function upsertTrustScore(userId) {
    const existing = await pool.query(`SELECT trust_score_id FROM trust_score WHERE user_id = $1`, [userId]);
    if (existing.rows.length === 0) {
        await pool.query(`INSERT INTO trust_score (user_id, internal_score, last_updated) VALUES ($1, 80, NOW())`, [userId]);
    } else {
        await pool.query(`UPDATE trust_score SET internal_score = 80, last_updated = NOW() WHERE user_id = $1`, [userId]);
    }
}

async function upsertMatch(user1Id, user2Id) {
    const u1 = Math.min(user1Id, user2Id);
    const u2 = Math.max(user1Id, user2Id);
    const existing = await pool.query(`SELECT match_id FROM matches WHERE user1_id = $1 AND user2_id = $2`, [u1, u2]);
    if (existing.rows.length > 0) {
        await pool.query(`UPDATE matches SET match_status = 'active' WHERE match_id = $1`, [existing.rows[0].match_id]);
        return existing.rows[0].match_id;
    }
    const result = await pool.query(
        `INSERT INTO matches (user1_id, user2_id, match_status, matched_at) VALUES ($1, $2, 'active', NOW()) RETURNING match_id`,
        [u1, u2]
    );
    return result.rows[0].match_id;
}

async function upsertSwipe(fromId, toId) {
    const existing = await pool.query(`SELECT swipe_id FROM swipes WHERE swipe_user_id = $1 AND swiped_user_id = $2`, [fromId, toId]);
    if (existing.rows.length === 0) {
        await pool.query(`INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at) VALUES ($1, $2, 'like', NOW())`, [fromId, toId]);
    }
}

async function seed() {
    const hash = await bcrypt.hash("demo1234", 10);

    const jordanId = await getOrCreateUser(
        "Jordan", "Blake", "jordan.blake@aura.demo", hash, "1997-04-10",
        2, "Chicago", "IL", "Passionate about music, hiking, and good coffee.",
        { religion_id: 5, activity_level: 2, music: 4, personality_type: 3, dating_goals: 2, children: 4, drinking_id: 3, smoking_id: 2, diet_id: 1 }
    );

    const rileyId = await getOrCreateUser(
        "Riley", "Morgan", "riley.morgan@aura.demo", hash, "1998-08-22",
        3, "Chicago", "IL", "Bookworm, dog lover, and weekend hiker looking for something real.",
        { religion_id: 5, activity_level: 2, music: 4, personality_type: 3, dating_goals: 2, children: 4, drinking_id: 3, smoking_id: 2, diet_id: 2 }
    );

    await upsertTrustScore(jordanId);
    await upsertTrustScore(rileyId);

    const matchId = await upsertMatch(jordanId, rileyId);

    await upsertSwipe(jordanId, rileyId);
    await upsertSwipe(rileyId, jordanId);

    console.log("\nDemo users ready:");
    console.log(`  Jordan Blake  — user_id: ${jordanId}  |  jordan.blake@aura.demo  |  password: demo1234`);
    console.log(`  Riley Morgan  — user_id: ${rileyId}  |  riley.morgan@aura.demo   |  password: demo1234`);
    console.log(`  Match ID: ${matchId}`);
    console.log("  Both users are mutually matched and ready to demo Feature 3.\n");

    await pool.end();
}

seed().catch(e => { console.error(e.message); process.exit(1); });