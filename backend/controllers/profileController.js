const pool = require("../config/db");
const { ni } = require("../utils/pgCoerce");

const GENDER         = { "Male": 1, "Man": 1, "Female": 2, "Woman": 2, "Non-binary": 3 };
const RELIGION       = { "Atheist": 1, "Agnostic": 2, "Buddhist": 3, "Catholic": 4, "Christian": 5, "Hindu": 6, "Jewish": 7, "Mormon": 8, "Muslim": 9, "Spiritual (non-religious)": 10, "Other": 11, "Prefer not to say": 12, "No preference": 13 };
const ETHNICITY      = { "Asian": 1, "Black / African American": 2, "Hispanic / Latino": 3, "Middle Eastern": 4, "Native American": 5, "Pacific Islander": 6, "White / Caucasian": 7, "Multiracial": 8, "Other": 9, "Prefer not to say": 10, "No preference": 11 };
const EDUCATION      = { "High School": 1, "Some College": 2, "Associate's Degree": 3, "Bachelor's Degree": 4, "Master's Degree": 5, "Doctorate / PhD": 6, "Trade / Vocational": 7, "Trade": 7, "Other": 8, "No preference": 9 };
const FAMILY         = { "Yes": 1, "No": 2, "No preference": 3 };
const SMOKING        = { "Yes": 1, "No": 2, "Occasionally": 3 };
const DRINKING       = { "Yes": 1, "No": 2, "Social": 3 };
const COFFEE         = { "Yes": 1, "No": 2 };
const DIET           = { "Omnivore": 1, "Vegetarian": 2, "Vegan": 3, "Other": 4 };
const ACTIVITY       = { "Low": 1, "Medium": 2, "High": 3, "No preference": 4 };
const MUSIC          = { "Pop": 1, "Hip-Hop / Rap": 2, "R&B / Soul": 3, "Rock": 4, "Country": 5, "Electronic / EDM": 6, "Jazz / Blues": 7, "Classical": 8, "Latin": 9, "Everything": 10, "Other": 11 };
const GAMER          = { "Yes": 1, "No": 2, "Casual": 3 };
const READER         = { "Yes": 1, "No": 2, "Occasionally": 3 };
const TRAVEL         = { "Love it": 1, "Occasionally": 2, "Not really": 3 };
const PETS           = { "Love animals": 1, "Have pets": 2, "Allergic": 3, "Not a fan": 4, "Neutral": 5 };
const PERSONALITY    = { "Introvert": 1, "Extrovert": 2, "Ambivert": 3 };
const DATING_GOALS   = { "Casual": 1, "Serious": 2, "Long-term": 3, "No preference": 4 };
const ASTROLOGY      = { "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6, "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12 };
const CHILDREN       = { "Want kids": 1, "Have kids": 2, "Don't want kids": 3, "Open": 4, "No preference": 5 };
const POLITICAL      = { "Very Liberal": 1, "Liberal": 2, "Moderate": 3, "Conservative": 4, "Very Conservative": 5, "Apolitical": 6, "Prefer not to say": 7, "No preference": 8 };

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
        activityPref, familyOrientedPref,
    } = req.body;

    try {
        const genderMap = { "Male": 1, "Man": 1, "Female": 2, "Woman": 2, "Non-binary": 3 };
        const preferred_gender = (genderPref && genderPref !== "No preference")
            ? (genderMap[genderPref] || null) : null;

        const prefResult = await pool.query(
            `INSERT INTO preferences
                (user_id, preferred_age_min, preferred_age_max,
                 preferred_height_min, preferred_height_max,
                 preferred_religion_type_id, preferred_ethnicity_id,
                 preferred_political_affil, preferred_want_children,
                 preferred_dating_goals, preferred_activity_level, preferred_family_oriented)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (user_id) DO UPDATE SET
                preferred_age_min           = EXCLUDED.preferred_age_min,
                preferred_age_max           = EXCLUDED.preferred_age_max,
                preferred_height_min        = EXCLUDED.preferred_height_min,
                preferred_height_max        = EXCLUDED.preferred_height_max,
                preferred_religion_type_id  = EXCLUDED.preferred_religion_type_id,
                preferred_ethnicity_id      = EXCLUDED.preferred_ethnicity_id,
                preferred_political_affil   = EXCLUDED.preferred_political_affil,
                preferred_want_children     = EXCLUDED.preferred_want_children,
                preferred_dating_goals      = EXCLUDED.preferred_dating_goals,
                preferred_activity_level    = EXCLUDED.preferred_activity_level,
                preferred_family_oriented   = EXCLUDED.preferred_family_oriented
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
                toId(ACTIVITY, activityPref),
                toId(FAMILY, familyOrientedPref),
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
                rt_pref.religion_name AS preferred_religion_label,
                et_pref.ethnicity_name AS preferred_ethnicity_label,
                dg.dating_goal_name   AS preferred_dating_goal,
                wc.want_children      AS preferred_children,
                po.political_affil    AS preferred_political,
                al.activity_name      AS preferred_activity,
                fo.family_oriented_name AS preferred_family,
                (SELECT array_agg(pg.gender_type_id) FILTER (WHERE pg.gender_type_id IS NOT NULL)
                   FROM preference_genders pg WHERE pg.preference_id = p.preference_id) AS preferred_gender_ids
             FROM preferences p
             LEFT JOIN religion_type   rt_pref ON rt_pref.religion_type_id = p.preferred_religion_type_id
             LEFT JOIN ethnicity_type  et_pref ON et_pref.ethnicity_type_id = p.preferred_ethnicity_id
             LEFT JOIN dating_goals    dg ON dg.dating_goals_id    = p.preferred_dating_goals
             LEFT JOIN want_children   wc ON wc.want_children_id   = p.preferred_want_children
             LEFT JOIN political_affil po ON po.political_affil_id = p.preferred_political_affil
             LEFT JOIN activity_level  al ON al.activity_level_id  = p.preferred_activity_level
             LEFT JOIN family_oriented fo ON fo.family_oriented_id = p.preferred_family_oriented
             WHERE p.user_id = $1`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.json({ preferences: null });
        }

        const row = result.rows[0];

        /** Profile.jsx partner <select>s use value="" for open; DB uses lookup label "No preference". */
        function partnerSelectOpenLabel(label) {
            if (label == null || label === "" || label === "No preference") return "";
            return label;
        }

        /** Partner ToggleGroups use "No preference" as explicit value when nothing chosen. */
        function partnerToggleLabel(label) {
            if (label == null || label === "") return "No preference";
            return label;
        }

        // seed_data: 1 Man, 2 Woman, 3 Non-binary, 4 Other, 5 Prefer not to say; v4: 6 Open to all
        const genderIdMap = {
            1: "Male",
            2: "Female",
            3: "Non-binary",
            4: "No preference",
            5: "No preference",
            6: "No preference",
        };
        const genderIds = row.preferred_gender_ids || [];
        const firstGid  = genderIds.length > 0 ? ni(genderIds[0]) : null;
        const genderPref =
            firstGid !== null ? (genderIdMap[firstGid] || "No preference") : "No preference";

        res.json({
            preferences: {
                genderPref,
                minAge:         row.preferred_age_min    || 18,
                maxAge:         row.preferred_age_max    || 100,
                minHeight:      row.preferred_height_min || 60,
                maxHeight:      row.preferred_height_max || 80,
                religionPref:   partnerSelectOpenLabel(row.preferred_religion_label),
                ethnicityPref:  partnerSelectOpenLabel(row.preferred_ethnicity_label),
                politicalPref:  partnerSelectOpenLabel(row.preferred_political),
                datingGoalPref: partnerToggleLabel(row.preferred_dating_goal),
                childrenPref:   partnerToggleLabel(row.preferred_children),
                activityPref:   partnerToggleLabel(row.preferred_activity),
                familyOrientedPref: partnerToggleLabel(row.preferred_family),
            }
        });
    } catch (err) {
        console.error("getPreferences error:", err.message);
        res.status(500).json({ error: "Failed to load preferences." });
    }
};