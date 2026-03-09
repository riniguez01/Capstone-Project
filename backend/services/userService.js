// userService.js
// Fetches user + preferences from the actual database schema.
// All fields align with the users, preferences, and preference_genders tables.

const pool = require("../config/db");

// ─── GET SINGLE USER WITH PREFERENCES ──────────────────────────────────────
async function getUserById(userId) {
    // Pull all matchable fields from users table
    const userResult = await pool.query(
        `SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.date_of_birth,
            u.gender_identity,
            u.height_cm,
            u.location_city,
            u.location_state,
            u.religion_id,
            u.ethnicity_id,
            u.education_career_id,
            u.smoking_id,
            u.drinking_id,
            u.coffee_id,
            u.diet_id,
            u.activity_level,
            u.family_oriented,
            u.music,
            u.gamer,
            u.reader,
            u.travel,
            u.pet_interest,
            u.personality_type,
            u.dating_goals,
            u.astrology,
            u.children,
            u.political,
            u.account_status,
            ts.internal_score AS trust_score
        FROM users u
        LEFT JOIN trust_score ts ON ts.user_id = u.user_id
        WHERE u.user_id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    // Pull preferences
    const prefResult = await pool.query(
        `SELECT
            p.preference_id,
            p.preferred_age_min,
            p.preferred_age_max,
            p.min_distance_miles,
            p.max_distance_miles,
            p.preferred_height_min,
            p.preferred_height_max,
            p.preferred_religion_type_id,
            p.preferred_smoking,
            p.preferred_drinking,
            p.preferred_coffee,
            p.preferred_diet,
            p.preferred_activity_level,
            p.preferred_music,
            p.preferred_family_oriented,
            p.preferred_isgamer,
            p.preferred_isreader,
            p.preferred_travel_interest,
            p.preferred_pet_interest,
            p.preferred_dating_goals,
            p.preferred_personality_type,
            p.preferred_astrology_sign,
            p.preferred_want_children,
            p.preferred_political_affil,
            array_agg(pg.gender_type_id) FILTER (WHERE pg.gender_type_id IS NOT NULL) AS preferred_genders
        FROM preferences p
        LEFT JOIN preference_genders pg ON pg.preference_id = p.preference_id
        WHERE p.user_id = $1
        GROUP BY p.preference_id`,
        [userId]
    );

    user.preferences = prefResult.rows[0] || null;
    return user;
}

// ─── GET ALL CANDIDATES (excluding requesting user) ─────────────────────────
async function getCandidates(excludeUserId) {
    const result = await pool.query(
        `SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.date_of_birth,
            u.gender_identity,
            u.height_cm,
            u.location_city,
            u.location_state,
            u.religion_id,
            u.ethnicity_id,
            u.education_career_id,
            u.smoking_id,
            u.drinking_id,
            u.coffee_id,
            u.diet_id,
            u.activity_level,
            u.family_oriented,
            u.music,
            u.gamer,
            u.reader,
            u.travel,
            u.pet_interest,
            u.personality_type,
            u.dating_goals,
            u.astrology,
            u.children,
            u.political,
            u.account_status,
            ts.internal_score AS trust_score
        FROM users u
        LEFT JOIN trust_score ts ON ts.user_id = u.user_id
        WHERE u.user_id != $1
          AND u.account_status = 'active'`,
        [excludeUserId]
    );

    return result.rows;
}

module.exports = { getUserById, getCandidates };