const pool = require("../config/db");

async function getUserById(userId) {
    const userResult = await pool.query(
        `SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.date_of_birth,
            u.gender_identity,
            gt.gender_name,
            u.height_inches,
            u.location_city,
            u.location_state,
            u.latitude,
            u.longitude,
            u.bio,
            u.account_status,
            u.tier_id,
            ts.internal_score         AS trust_score,
            ph.photo_url              AS profile_photo_url,
            rt.religion_name,
            sm.smoking_name,
            dr.drinking_name,
            di.diet_name,
            al.activity_name,
            fo.family_oriented_name,
            mu.music_name,
            ga.isgamer_name,
            re.isreader_name,
            tr.travel_interest_name,
            pe.pet_interest_name,
            pt.personality_type_name,
            dg.dating_goal_name       AS dating_goals_name,
            wc.want_children          AS children_name,
            pa.political_affil        AS political_name,
            ec.education_career_name
        FROM users u
        LEFT JOIN gender_type      gt ON gt.gender_type_id       = u.gender_identity
        LEFT JOIN trust_score      ts ON ts.user_id              = u.user_id
        LEFT JOIN photo            ph ON ph.user_id              = u.user_id AND ph.is_primary = true
        LEFT JOIN religion_type    rt ON rt.religion_type_id     = u.religion_id
        LEFT JOIN smoking          sm ON sm.smoking_id           = u.smoking_id
        LEFT JOIN drinking         dr ON dr.drinking_id          = u.drinking_id
        LEFT JOIN diet             di ON di.diet_id              = u.diet_id
        LEFT JOIN activity_level   al ON al.activity_level_id   = u.activity_level
        LEFT JOIN family_oriented  fo ON fo.family_oriented_id  = u.family_oriented
        LEFT JOIN music            mu ON mu.music_id             = u.music
        LEFT JOIN gamer            ga ON ga.isgamer_id           = u.gamer
        LEFT JOIN reader           re ON re.isreader_id          = u.reader
        LEFT JOIN travel_interest  tr ON tr.travel_interest_id  = u.travel
        LEFT JOIN pet_interest     pe ON pe.pet_interest_id      = u.pet_interest
        LEFT JOIN personality_type pt ON pt.personality_type_id  = u.personality_type
        LEFT JOIN dating_goals     dg ON dg.dating_goals_id      = u.dating_goals
        LEFT JOIN want_children    wc ON wc.want_children_id     = u.children
        LEFT JOIN political_affil  pa ON pa.political_affil_id   = u.political
        LEFT JOIN education_career ec ON ec.education_career_id  = u.education_career_id
        WHERE u.user_id = $1`,
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
        `SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.date_of_birth,
            u.gender_identity,
            gt.gender_name,
            u.height_inches,
            u.location_city,
            u.location_state,
            u.latitude,
            u.longitude,
            u.bio,
            u.account_status,
            u.tier_id,
            ts.internal_score         AS trust_score,
            ph.photo_url              AS profile_photo_url,
            rt.religion_name,
            sm.smoking_name,
            dr.drinking_name,
            di.diet_name,
            al.activity_name,
            fo.family_oriented_name,
            mu.music_name,
            ga.isgamer_name,
            re.isreader_name,
            tr.travel_interest_name,
            pe.pet_interest_name,
            pt.personality_type_name,
            dg.dating_goal_name       AS dating_goals_name,
            wc.want_children          AS children_name,
            pa.political_affil        AS political_name,
            ec.education_career_name,
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
            u.religion_id,
            u.ethnicity_id,
            u.education_career_id
        FROM users u
        LEFT JOIN gender_type      gt ON gt.gender_type_id       = u.gender_identity
        LEFT JOIN trust_score      ts ON ts.user_id              = u.user_id
        LEFT JOIN photo            ph ON ph.user_id              = u.user_id AND ph.is_primary = true
        LEFT JOIN religion_type    rt ON rt.religion_type_id     = u.religion_id
        LEFT JOIN smoking          sm ON sm.smoking_id           = u.smoking_id
        LEFT JOIN drinking         dr ON dr.drinking_id          = u.drinking_id
        LEFT JOIN diet             di ON di.diet_id              = u.diet_id
        LEFT JOIN activity_level   al ON al.activity_level_id   = u.activity_level
        LEFT JOIN family_oriented  fo ON fo.family_oriented_id  = u.family_oriented
        LEFT JOIN music            mu ON mu.music_id             = u.music
        LEFT JOIN gamer            ga ON ga.isgamer_id           = u.gamer
        LEFT JOIN reader           re ON re.isreader_id          = u.reader
        LEFT JOIN travel_interest  tr ON tr.travel_interest_id  = u.travel
        LEFT JOIN pet_interest     pe ON pe.pet_interest_id      = u.pet_interest
        LEFT JOIN personality_type pt ON pt.personality_type_id  = u.personality_type
        LEFT JOIN dating_goals     dg ON dg.dating_goals_id      = u.dating_goals
        LEFT JOIN want_children    wc ON wc.want_children_id     = u.children
        LEFT JOIN political_affil  pa ON pa.political_affil_id   = u.political
        LEFT JOIN education_career ec ON ec.education_career_id  = u.education_career_id
        WHERE u.user_id != $1
          AND u.account_status = 'active'`,
        [excludeUserId]
    );
    return result.rows;
}

module.exports = { getUserById, getCandidates };