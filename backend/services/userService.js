// userService.js
const pool = require("../config/db");

const USER_SELECT = `
    u.user_id,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender_identity,
    u.height_inches,
    u.location_city,
    u.location_state,
    u.bio,
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
    -- display name joins
    gt.gender_name,
    rt.religion_name,
    al.activity_name,
    wc.want_children        AS children_name,
    pa.political_affil      AS political_name,
    dg.dating_goal_name     AS dating_goals_name,
    sm.smoking_name,
    dr.drinking_name,
    di.diet_name,
    mu.music_name,
    fo.family_oriented_name,
    pt.personality_type_name,
    ec.education_career_name,
    ts.internal_score       AS trust_score,
    ph.photo_url            AS profile_photo_url
`;

const USER_JOINS = `
    LEFT JOIN gender_type       gt  ON gt.gender_type_id       = u.gender_identity
    LEFT JOIN religion_type     rt  ON rt.religion_type_id     = u.religion_id
    LEFT JOIN activity_level    al  ON al.activity_level_id    = u.activity_level
    LEFT JOIN want_children     wc  ON wc.want_children_id     = u.children
    LEFT JOIN political_affil   pa  ON pa.political_affil_id   = u.political
    LEFT JOIN dating_goals      dg  ON dg.dating_goals_id      = u.dating_goals
    LEFT JOIN smoking           sm  ON sm.smoking_id           = u.smoking_id
    LEFT JOIN drinking          dr  ON dr.drinking_id          = u.drinking_id
    LEFT JOIN diet              di  ON di.diet_id              = u.diet_id
    LEFT JOIN music             mu  ON mu.music_id             = u.music
    LEFT JOIN family_oriented   fo  ON fo.family_oriented_id   = u.family_oriented
    LEFT JOIN personality_type  pt  ON pt.personality_type_id  = u.personality_type
    LEFT JOIN education_career  ec  ON ec.education_career_id  = u.education_career_id
    LEFT JOIN trust_score       ts  ON ts.user_id              = u.user_id
    LEFT JOIN photo             ph  ON ph.user_id              = u.user_id AND ph.is_primary = true
`;

async function getUserById(userId) {
    const userResult = await pool.query(
        `SELECT ${USER_SELECT} FROM users u ${USER_JOINS} WHERE u.user_id = $1`,
        [userId]
    );
    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

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

async function getCandidates(excludeUserId) {
    const result = await pool.query(
        `SELECT ${USER_SELECT} FROM users u ${USER_JOINS}
         WHERE u.user_id != $1 AND u.account_status = 'active'`,
        [excludeUserId]
    );
    return result.rows;
}

module.exports = { getUserById, getCandidates };