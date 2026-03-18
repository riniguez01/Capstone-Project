// profileController.js
// POST /profile/save — saves questionnaire and profile field updates for a user
// Matches every field from Alex's profile.jsx and questionnaire.jsx

const pool = require("../config/db");

// ─── POST /profile/save ────────────────────────────────────────────────────
// Expects user_id + all profile fields from the questionnaire/profile pages.
// All enum fields are stored as FK integers — see scoreMatch.js for seed order.
exports.saveProfile = async (req, res) => {
    const {
        user_id,
        // Basic info
        name,
        location,
        bio,
        // Identity & Background (FK IDs)
        religion_id,
        ethnicity_id,
        education_career_id,
        family_oriented,
        // Lifestyle (FK IDs)
        smoking_id,
        drinking_id,
        coffee_id,
        diet_id,
        activity_level,
        // Interests (FK IDs)
        music,
        gamer,
        reader,
        travel,
        pet_interest,
        // Personality & Values (FK IDs)
        personality_type,
        dating_goals,
        astrology,
        political,
        // Relationship & Family (FK IDs)
        children,
    } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "user_id is required." });
    }

    try {
        // Split name into first/last if provided as single string
        let first_name = null;
        let last_name  = null;
        if (name) {
            const parts = name.trim().split(" ");
            first_name = parts[0] || null;
            last_name  = parts.slice(1).join(" ") || null;
        }

        await pool.query(
            `UPDATE users SET
                first_name          = COALESCE($1,  first_name),
                last_name           = COALESCE($2,  last_name),
                location_city       = COALESCE($3,  location_city),
                bio                 = COALESCE($4,  bio),
                religion_id         = COALESCE($5,  religion_id),
                ethnicity_id        = COALESCE($6,  ethnicity_id),
                education_career_id = COALESCE($7,  education_career_id),
                family_oriented     = COALESCE($8,  family_oriented),
                smoking_id          = COALESCE($9,  smoking_id),
                drinking_id         = COALESCE($10, drinking_id),
                coffee_id           = COALESCE($11, coffee_id),
                diet_id             = COALESCE($12, diet_id),
                activity_level      = COALESCE($13, activity_level),
                music               = COALESCE($14, music),
                gamer               = COALESCE($15, gamer),
                reader              = COALESCE($16, reader),
                travel              = COALESCE($17, travel),
                pet_interest        = COALESCE($18, pet_interest),
                personality_type    = COALESCE($19, personality_type),
                dating_goals        = COALESCE($20, dating_goals),
                astrology           = COALESCE($21, astrology),
                political           = COALESCE($22, political),
                children            = COALESCE($23, children)
            WHERE user_id = $24`,
            [
                first_name, last_name, location, bio,
                religion_id, ethnicity_id, education_career_id, family_oriented,
                smoking_id, drinking_id, coffee_id, diet_id, activity_level,
                music, gamer, reader, travel, pet_interest,
                personality_type, dating_goals, astrology, political, children,
                user_id
            ]
        );

        res.json({ message: "Profile saved successfully." });
    } catch (err) {
        console.error("saveProfile error:", err.message);
        res.status(500).json({ error: "Failed to save profile." });
    }
};

// ─── POST /profile/preferences ─────────────────────────────────────────────
// Saves the preferences/filters section (age range, height, gender pref, etc.)
exports.savePreferences = async (req, res) => {
    const {
        user_id,
        preferred_age_min,
        preferred_age_max,
        preferred_height_min, // expected in cm — frontend must convert from inches
        preferred_height_max,
        preferred_genders,    // array of gender_type_ids
        preferred_political_affil,
        preferred_smoking,
        preferred_drinking,
        preferred_want_children,
        preferred_dating_goals,
    } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "user_id is required." });
    }

    try {
        // Upsert preferences row
        const prefResult = await pool.query(
            `INSERT INTO preferences (user_id, preferred_age_min, preferred_age_max, preferred_height_min, preferred_height_max, preferred_political_affil, preferred_smoking, preferred_drinking, preferred_want_children, preferred_dating_goals)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (user_id) DO UPDATE SET
                preferred_age_min         = EXCLUDED.preferred_age_min,
                preferred_age_max         = EXCLUDED.preferred_age_max,
                preferred_height_min      = EXCLUDED.preferred_height_min,
                preferred_height_max      = EXCLUDED.preferred_height_max,
                preferred_political_affil = EXCLUDED.preferred_political_affil,
                preferred_smoking         = EXCLUDED.preferred_smoking,
                preferred_drinking        = EXCLUDED.preferred_drinking,
                preferred_want_children   = EXCLUDED.preferred_want_children,
                preferred_dating_goals    = EXCLUDED.preferred_dating_goals
             RETURNING preference_id`,
            [user_id, preferred_age_min, preferred_age_max, preferred_height_min, preferred_height_max, preferred_political_affil, preferred_smoking, preferred_drinking, preferred_want_children, preferred_dating_goals]
        );

        const preference_id = prefResult.rows[0].preference_id;

        // Replace preferred_genders entries
        if (Array.isArray(preferred_genders)) {
            await pool.query(
                "DELETE FROM preference_genders WHERE preference_id = $1",
                [preference_id]
            );
            for (const genderId of preferred_genders) {
                await pool.query(
                    "INSERT INTO preference_genders (preference_id, gender_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [preference_id, genderId]
                );
            }
        }

        res.json({ message: "Preferences saved successfully." });
    } catch (err) {
        console.error("savePreferences error:", err.message);
        res.status(500).json({ error: "Failed to save preferences." });
    }
};