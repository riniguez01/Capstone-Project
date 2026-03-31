const pool = require("../config/db");

exports.submitCheckin = async (req, res) => {
    const {
        reviewer_user_id,
        reviewed_user_id,
        schedule_id,
        comfort_level,
        felt_safe,
        boundaries_respected,
        felt_pressured,
        would_meet_again,
        short_comment
    } = req.body;


    if (!reviewer_user_id || !reviewed_user_id) {
        return res.status(400).json({error: "reviewer_user_id and reviewed_user_id are required."});
    }
    if (!comfort_level || comfort_level < 1 || comfort_level > 5) {
        return res.status(400).json({error: "comfort_level must be between 1 and 5."});
    }
    if (!felt_pressured || !would_meet_again) {
        return res.status(400).json({error: "Please fill in all required fields."});
    }

    try {
        await pool.query(
            `INSERT INTO post_date_checkin
             (schedule_id, reviewer_user_id, reviewed_user_id,
              comfort_level, felt_safe, boundaries_respected,
              felt_pressured, would_meet_again, short_comment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
                schedule_id || null,
                reviewer_user_id,
                reviewed_user_id,
                comfort_level,
                felt_safe === "Yes",
                boundaries_respected === "Yes",
                felt_pressured === "Yes",
                would_meet_again,
                short_comment || null
            ]
        );


        let scoreChange = 0;

        if (felt_safe === "No")
            scoreChange -= 5;
        if (boundaries_respected === "No")
            scoreChange -= 4;
        if (felt_pressured === "Yes")
            scoreChange -= 3;
        if (comfort_level <= 2)
            scoreChange -= 3;
        if (comfort_level >= 4)
            scoreChange += 2;
        if (felt_safe === "Yes")
            scoreChange += 2;
        if (boundaries_respected === "Yes")
            scoreChange += 2;
        if (would_meet_again === "yes")
            scoreChange += 2;
        if (would_meet_again === "no")
            scoreChange -= 2;


        const trustResult = await pool.query(
            "SELECT internal_score FROM trust_score WHERE user_id = $1",
            [reviewed_user_id]
        );

        if (trustResult.rows.length === 0) {
            return res.status(404).json({error: "Trust score not found for reviewed user."});
        }

        const currentScore = trustResult.rows[0].internal_score;
        const previousScore = currentScore;


        const newScore = Math.min(100, Math.max(0, currentScore + scoreChange));


        await pool.query(
            "UPDATE trust_score SET internal_score = $1, last_updated = NOW() WHERE user_id = $2",
            [newScore, reviewed_user_id]
        );

        // Step 5 — Log to trust_score_history
        await pool.query(
            `INSERT INTO trust_score_history
                 (user_id, score_before, score_after, change_reason, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
                reviewed_user_id,
                previousScore,
                newScore,
                `Post date checkin submitted by user ${reviewer_user_id}`
            ]
        );


        const newStarRating = Math.round(newScore / 20);

        res.status(201).json({
            message: "Checkin submitted successfully.",
            trust_score: {
                previous: previousScore,
                updated: newScore,
                change: scoreChange,
                star_rating: newStarRating
            }
        });

    } catch (err) {
        console.error("submitCheckin error:", err.message);
        res.status(500).json({error: "Failed to submit checkin."});
    }
};


exports.getCheckinHistory = async (req, res) => {
    const {user_id} = req.params;

    try {
        const result = await pool.query(
            `SELECT pdc.*,
                    u.first_name as reviewer_name
             FROM post_date_checkin pdc
                      JOIN users u ON u.user_id = pdc.reviewer_user_id
             WHERE pdc.reviewed_user_id = $1
             ORDER BY pdc.created_at DESC`,
            [user_id]
        );

        res.json({checkins: result.rows});
    } catch (err) {
        console.error("getCheckinHistory error:", err.message);
        res.status(500).json({error: "Failed to fetch checkin history."});
    }
};