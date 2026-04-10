const pool = require("../config/db");

const GENDER         = { "Male": 2, "Man": 2, "Female": 3, "Woman": 3, "Non-binary": 4 };
const RELIGION       = { "No preference": 1, "Atheist": 2, "Agnostic": 3, "Buddhist": 4, "Catholic": 5, "Christian": 6, "Hindu": 7, "Jewish": 8, "Mormon": 9, "Muslim": 10, "Spiritual (non-religious)": 11, "Other": 12, "Prefer not to say": 13 };
const ETHNICITY      = { "No preference": 1, "Asian": 2, "Black / African American": 3, "Hispanic / Latino": 4, "Middle Eastern": 5, "Native American": 6, "Pacific Islander": 7, "White / Caucasian": 8, "Multiracial": 9, "Other": 10, "Prefer not to say": 11 };
const EDUCATION      = { "No preference": 1, "High School": 2, "Some College": 3, "Associate's Degree": 4, "Bachelor's Degree": 5, "Master's Degree": 6, "Doctorate / PhD": 7, "Trade / Vocational": 8, "Trade": 8, "Other": 9 };
const FAMILY         = { "No preference": 1, "Yes": 2, "No": 3 };
const SMOKING        = { "Yes": 1, "No": 2, "Occasionally": 3 };
const DRINKING       = { "Yes": 1, "No": 2, "Social": 3 };
const COFFEE         = { "Yes": 1, "No": 2 };
const DIET           = { "Omnivore": 1, "Vegetarian": 2, "Vegan": 3, "Other": 4 };
const ACTIVITY       = { "No preference": 1, "Low": 2, "Medium": 3, "High": 4 };
const MUSIC          = { "Pop": 1, "Hip-Hop / Rap": 2, "R&B / Soul": 3, "Rock": 4, "Country": 5, "Electronic / EDM": 6, "Jazz / Blues": 7, "Classical": 8, "Latin": 9, "Everything": 10, "Other": 11 };
const GAMER          = { "Yes": 1, "No": 2, "Casual": 3 };
const READER         = { "Yes": 1, "No": 2, "Occasionally": 3 };
const TRAVEL         = { "Love it": 1, "Occasionally": 2, "Not really": 3 };
const PETS           = { "Love animals": 1, "Have pets": 2, "Allergic": 3, "Not a fan": 4, "Neutral": 5 };
const PERSONALITY    = { "Introvert": 1, "Extrovert": 2, "Ambivert": 3 };
const DATING_GOALS   = { "No preference": 1, "Casual": 2, "Serious": 3, "Long-term": 4 };
const ASTROLOGY      = { "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6, "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12 };
const CHILDREN       = { "No preference": 1, "Want kids": 2, "Have kids": 3, "Don't want kids": 4, "Open": 5 };
const POLITICAL      = { "No preference": 1, "Very Liberal": 2, "Liberal": 3, "Moderate": 4, "Conservative": 5, "Very Conservative": 6, "Apolitical": 7, "Prefer not to say": 8 };

function toId(map, label) {
    if (!label || label === "") return null;
    return map[label] ?? null;
}

exports.saveProfile = async (req, res) => {
    const user_id = req.user?.id;
    if (!user_id) return res.status(400).json({ error: "user_id is required." });

    const {
        name, location, bio, height,
        gender, religion, ethnicity, education, familyOriented,
        smoker, drinker, coffeeDrinker, diet, activityLevel,
        musicPref, gamer, reader, travel, pets,
        personality, datingGoal, astrology, children, politicalStanding,
    } = req.body;

    try {
        let first_name = null, last_name = null;
        if (name && name.trim()) {
            const parts = name.trim().split(" ");
            first_name = parts[0] || null;
            last_name  = parts.slice(1).join(" ") || null;
        }

        let location_city = null;
        let location_state = null;
        if (location && location.trim()) {
            const locParts = location.trim().split(",");
            if (locParts.length < 2 || !locParts[1].trim()) {
                return res.status(400).json({ error: "Please enter your location as City, State (e.g. Chicago, IL)." });
            }
            location_city  = locParts[0].trim();
            location_state = locParts[1].trim();
        }

        await pool.query(
            `UPDATE users SET
                first_name          = COALESCE($1,  first_name),
                last_name           = COALESCE($2,  last_name),
                location_city       = COALESCE($3,  location_city),
                location_state      = COALESCE($4,  location_state),
                bio                 = COALESCE($5,  bio),
                height_inches       = COALESCE($6,  height_inches),
                gender_identity     = COALESCE($7,  gender_identity),
                religion_id         = COALESCE($8,  religion_id),
                ethnicity_id        = COALESCE($9,  ethnicity_id),
                education_career_id = COALESCE($10, education_career_id),
                family_oriented     = COALESCE($11, family_oriented),
                smoking_id          = COALESCE($12, smoking_id),
                drinking_id         = COALESCE($13, drinking_id),
                coffee_id           = COALESCE($14, coffee_id),
                diet_id             = COALESCE($15, diet_id),
                activity_level      = COALESCE($16, activity_level),
                music               = COALESCE($17, music),
                gamer               = COALESCE($18, gamer),
                reader              = COALESCE($19, reader),
                travel              = COALESCE($20, travel),
                pet_interest        = COALESCE($21, pet_interest),
                personality_type    = COALESCE($22, personality_type),
                dating_goals        = COALESCE($23, dating_goals),
                astrology           = COALESCE($24, astrology),
                children            = COALESCE($25, children),
                political           = COALESCE($26, political)
            WHERE user_id = $27`,
            [
                first_name, last_name, location_city, location_state, bio || null, height || null,
                toId(GENDER, gender), toId(RELIGION, religion), toId(ETHNICITY, ethnicity),
                toId(EDUCATION, education), toId(FAMILY, familyOriented),
                toId(SMOKING, smoker), toId(DRINKING, drinker), toId(COFFEE, coffeeDrinker),
                toId(DIET, diet), toId(ACTIVITY, activityLevel), toId(MUSIC, musicPref),
                toId(GAMER, gamer), toId(READER, reader), toId(TRAVEL, travel),
                toId(PETS, pets), toId(PERSONALITY, personality),
                toId(DATING_GOALS, datingGoal), toId(ASTROLOGY, astrology),
                toId(CHILDREN, children), toId(POLITICAL, politicalStanding),
                user_id
            ]
        );

        res.json({ message: "Profile saved successfully." });
    } catch (err) {
        console.error("saveProfile error:", err.message);
        res.status(500).json({ error: "Failed to save profile." });
    }
};

exports.savePreferences = async (req, res) => {
    const user_id = req.user?.id;
    if (!user_id) return res.status(400).json({ error: "user_id is required." });

    const {
        genderPref, minAge, maxAge, minHeight, maxHeight,
        religionPref, ethnicityPref, politicalPref, childrenPref, datingGoalPref,
    } = req.body;

    try {
        const genderMap = { "Male": 2, "Man": 2, "Female": 3, "Woman": 3, "Non-binary": 4 };
        const preferred_gender = (genderPref && genderPref !== "No preference")
            ? (genderMap[genderPref] || null) : null;

        const prefResult = await pool.query(
            `INSERT INTO preferences
                (user_id, preferred_age_min, preferred_age_max,
                 preferred_height_min, preferred_height_max,
                 preferred_religion_type_id, preferred_ethnicity_id,
                 preferred_political_affil, preferred_want_children,
                 preferred_dating_goals)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (user_id) DO UPDATE SET
                preferred_age_min           = EXCLUDED.preferred_age_min,
                preferred_age_max           = EXCLUDED.preferred_age_max,
                preferred_height_min        = EXCLUDED.preferred_height_min,
                preferred_height_max        = EXCLUDED.preferred_height_max,
                preferred_religion_type_id  = EXCLUDED.preferred_religion_type_id,
                preferred_ethnicity_id      = EXCLUDED.preferred_ethnicity_id,
                preferred_political_affil   = EXCLUDED.preferred_political_affil,
                preferred_want_children     = EXCLUDED.preferred_want_children,
                preferred_dating_goals      = EXCLUDED.preferred_dating_goals
             RETURNING preference_id`,
            [
                user_id,
                minAge    || 18,
                maxAge    || 100,
                minHeight || 60,
                maxHeight || 80,
                toId(RELIGION,     religionPref),
                toId(ETHNICITY,    ethnicityPref),
                toId(POLITICAL,    politicalPref),
                toId(CHILDREN,     childrenPref),
                toId(DATING_GOALS, datingGoalPref),
            ]
        );

        const preference_id = prefResult.rows[0].preference_id;

        await pool.query("DELETE FROM preference_genders WHERE preference_id = $1", [preference_id]);
        if (preferred_gender) {
            await pool.query(
                "INSERT INTO preference_genders (preference_id, gender_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [preference_id, preferred_gender]
            );
        }

        res.json({ message: "Preferences saved successfully." });
    } catch (err) {
        console.error("savePreferences error:", err.message);
        res.status(500).json({ error: "Failed to save preferences." });
    }
};

exports.getPreferences = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `SELECT
                p.preferred_age_min,
                p.preferred_age_max,
                p.preferred_height_min,
                p.preferred_height_max,
                p.preferred_religion_type_id,
                p.preferred_ethnicity_id,
                dg.dating_goal_name   AS preferred_dating_goal,
                wc.want_children      AS preferred_children,
                po.political_affil    AS preferred_political,
                array_agg(pg.gender_type_id) FILTER (WHERE pg.gender_type_id IS NOT NULL) AS preferred_gender_ids
             FROM preferences p
             LEFT JOIN dating_goals    dg ON dg.dating_goals_id    = p.preferred_dating_goals
             LEFT JOIN want_children   wc ON wc.want_children_id   = p.preferred_want_children
             LEFT JOIN political_affil po ON po.political_affil_id = p.preferred_political_affil
             LEFT JOIN preference_genders pg ON pg.preference_id   = p.preference_id
             WHERE p.user_id = $1
             GROUP BY p.preference_id, dg.dating_goal_name, wc.want_children, po.political_affil`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.json({ preferences: null });
        }

        const row = result.rows[0];
        const genderIdMap   = { 2: "Male", 3: "Female", 4: "Non-binary" };
        const religionIdMap = { 1: "No preference", 2: "Atheist", 3: "Agnostic", 4: "Buddhist", 5: "Catholic", 6: "Christian", 7: "Hindu", 8: "Jewish", 9: "Mormon", 10: "Muslim", 11: "Spiritual (non-religious)", 12: "Other", 13: "Prefer not to say" };
        const ethnicityIdMap = { 1: "No preference", 2: "Asian", 3: "Black / African American", 4: "Hispanic / Latino", 5: "Middle Eastern", 6: "Native American", 7: "Pacific Islander", 8: "White / Caucasian", 9: "Multiracial", 10: "Other", 11: "Prefer not to say" };
        const genderIds     = row.preferred_gender_ids || [];
        const genderPref    = genderIds.length > 0 ? (genderIdMap[genderIds[0]] || "No preference") : "No preference";

        res.json({
            preferences: {
                genderPref,
                minAge:         row.preferred_age_min    || 18,
                maxAge:         row.preferred_age_max    || 100,
                minHeight:      row.preferred_height_min || 60,
                maxHeight:      row.preferred_height_max || 80,
                religionPref:   religionIdMap[row.preferred_religion_type_id] || "",
                ethnicityPref:  ethnicityIdMap[row.preferred_ethnicity_id]    || "",
                datingGoalPref: row.preferred_dating_goal || "",
                childrenPref:   row.preferred_children    || "",
                politicalPref:  row.preferred_political   || "",
            }
        });
    } catch (err) {
        console.error("getPreferences error:", err.message);
        res.status(500).json({ error: "Failed to load preferences." });
    }
};