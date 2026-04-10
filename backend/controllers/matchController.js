const generateMatches = require("../services/matchingService");
const { getUserById, getCandidates } = require("../services/userService");
const pool = require("../config/db");

const LIKE_LIMITS = { 1: 3, 2: 5 };

function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function trustToStars(trustScore) {
    if (trustScore === null || trustScore === undefined) return 3;
    if (trustScore <= 40) return 1;
    if (trustScore <= 55) return 2;
    if (trustScore <= 70) return 3;
    if (trustScore <= 85) return 4;
    return 5;
}

function inchesToDisplay(inches) {
    if (!inches) return null;
    const ft = Math.floor(inches / 12);
    const inch = inches % 12;
    return `${ft}'${inch}"`;
}

async function getLikesToday(userId) {
    const result = await pool.query(
        `SELECT COUNT(*) AS count FROM swipes
         WHERE swipe_user_id = $1 AND swipe_type = 'like'
           AND created_at >= NOW() - INTERVAL '24 hours'`,
        [userId]
    );
    return parseInt(result.rows[0].count);
}

exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await getCandidates(0);
        res.json(candidates);
    } catch (err) {
        console.error("getAllCandidates error:", err.message);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};

exports.getMatches = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });

        const shouldRank = req.query.ranked !== "false";
        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const swipedResult = await pool.query(
            `SELECT swiped_user_id FROM swipes WHERE swipe_user_id = $1`,
            [userId]
        );
        const swipedIds = new Set(swipedResult.rows.map(r => r.swiped_user_id));

        const allCandidates = await getCandidates(userId);
        const candidates = allCandidates.filter(c => !swipedIds.has(c.user_id));
        const matches = await generateMatches(user, candidates, shouldRank);

        const likesToday = await getLikesToday(userId);
        const tierLimit  = LIKE_LIMITS[user.tier_id] || 3;
        const likesLeft  = Math.max(0, tierLimit - likesToday);

        const fullMatches = matches.map(match => {
            const c = candidates.find(c => c.user_id === match.user_id);
            if (!c) return null;

            const avatarUrl = `https://ui-avatars.com/api/?background=c94b5b&color=fff&size=300&name=${encodeURIComponent((c.first_name || "") + "+" + (c.last_name || ""))}`;

            return {
                user_id:              c.user_id,
                name:                 `${c.first_name} ${c.last_name}`.trim(),
                first_name:           c.first_name           || null,
                last_name:            c.last_name            || null,
                age:                  getAge(c.date_of_birth),
                gender:               c.gender_name          || null,
                height:               inchesToDisplay(c.height_inches),
                location:             c.location_city
                    ? `${c.location_city}${c.location_state ? ", " + c.location_state : ""}`.trim()
                    : null,
                location_city:        c.location_city        || null,
                location_state:       c.location_state       || null,
                bio:                  c.bio                  || null,
                image:                c.profile_photo_url    || avatarUrl,
                starRating:           trustToStars(c.trust_score),
                religion_name:        c.religion_name        || null,
                activity_name:        c.activity_name        || null,
                children_name:        c.children_name        || null,
                political_name:       c.political_name       || null,
                dating_goals_name:    c.dating_goals_name    || null,
                smoking_name:         c.smoking_name         || null,
                drinking_name:        c.drinking_name        || null,
                diet_name:            c.diet_name            || null,
                music_name:           c.music_name           || null,
                family_oriented_name: c.family_oriented_name || null,
                personality_name:     c.personality_type_name|| null,
                education_name:       c.education_career_name|| null,
                score:                match.score,
                raw_score:            match.raw_score,
                trust_penalized:      match.trust_penalized,
                breakdown:            match.breakdown,
            };
        }).filter(Boolean);

        res.json({
            user_id:       userId,
            total_matches: fullMatches.length,
            likes_today:   likesToday,
            likes_left:    likesLeft,
            tier_limit:    tierLimit,
            matches:       fullMatches,
        });
    } catch (err) {
        console.error("getMatches error:", err.message);
        res.status(500).json({ error: "Failed to generate matches" });
    }
};

exports.likeUser = async (req, res) => {
    try {
        const userId      = parseInt(req.params.userId);
        const likedUserId = parseInt(req.body.liked_user_id);

        if (isNaN(userId) || isNaN(likedUserId))
            return res.status(400).json({ error: "Invalid user ID" });
        if (userId === likedUserId)
            return res.status(400).json({ error: "You cannot like yourself" });

        const userResult = await pool.query(
            "SELECT tier_id FROM users WHERE user_id = $1", [userId]
        );
        if (userResult.rows.length === 0)
            return res.status(404).json({ error: "User not found" });

        const tierId     = userResult.rows[0].tier_id || 1;
        const tierLimit  = LIKE_LIMITS[tierId] || 3;
        const likesToday = await getLikesToday(userId);

        if (likesToday >= tierLimit) {
            return res.status(429).json({
                error: "Daily like limit reached.",
                likes_used: likesToday, tier_limit: tierLimit, resets_in: "24 hours",
            });
        }

        const existing = await pool.query(
            `SELECT swipe_id FROM swipes
             WHERE swipe_user_id = $1 AND swiped_user_id = $2 AND swipe_type = 'like'`,
            [userId, likedUserId]
        );
        if (existing.rows.length > 0)
            return res.status(409).json({ error: "Already liked this user" });

        await pool.query(
            `INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at)
             VALUES ($1, $2, 'like', NOW())`,
            [userId, likedUserId]
        );

        const mutualLike = await pool.query(
            `SELECT swipe_id FROM swipes
             WHERE swipe_user_id = $1 AND swiped_user_id = $2 AND swipe_type = 'like'`,
            [likedUserId, userId]
        );

        let matchCreated = false;
        if (mutualLike.rows.length > 0) {
            const user1 = Math.min(userId, likedUserId);
            const user2 = Math.max(userId, likedUserId);
            await pool.query(
                `INSERT INTO matches (user1_id, user2_id, match_status, matched_at)
                 VALUES ($1, $2, 'active', NOW())
                 ON CONFLICT (user1_id, user2_id) DO NOTHING`,
                [user1, user2]
            );
            matchCreated = true;
        }

        res.status(201).json({
            message:       matchCreated ? "It's a match!" : "Like recorded.",
            match_created: matchCreated,
            likes_used:    likesToday + 1,
            likes_left:    Math.max(0, tierLimit - likesToday - 1),
            tier_limit:    tierLimit,
        });
    } catch (err) {
        console.error("likeUser error:", err.message);
        res.status(500).json({ error: "Failed to record like" });
    }
};

exports.getMutualMatches = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });

        const result = await pool.query(
            `SELECT
                m.match_id,
                m.matched_at,
                CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END AS other_user_id,
                CASE WHEN m.user1_id = $1 THEN u2.first_name ELSE u1.first_name END AS first_name,
                CASE WHEN m.user1_id = $1 THEN u2.last_name  ELSE u1.last_name  END AS last_name,
                CASE WHEN m.user1_id = $1 THEN u2.profile_photo_url ELSE u1.profile_photo_url END AS profile_photo_url,
                (SELECT content FROM message WHERE match_id = m.match_id ORDER BY sent_at DESC LIMIT 1) AS last_message,
                (SELECT sent_at  FROM message WHERE match_id = m.match_id ORDER BY sent_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM message WHERE match_id = m.match_id AND sender_id != $1 AND read_at IS NULL) AS unread_count
            FROM matches m
            JOIN users u1 ON u1.user_id = m.user1_id
            JOIN users u2 ON u2.user_id = m.user2_id
            WHERE (m.user1_id = $1 OR m.user2_id = $1)
              AND m.match_status = 'active'
            ORDER BY last_message_at DESC NULLS LAST`,
            [userId]
        );

        const matches = result.rows.map(row => ({
            match_id:        row.match_id,
            user_id:         row.other_user_id,
            name:            `${row.first_name} ${row.last_name}`.trim(),
            image:           row.profile_photo_url ||
                `https://ui-avatars.com/api/?background=c94b5b&color=fff&size=300&name=${encodeURIComponent(row.first_name + "+" + row.last_name)}`,
            last_message:    row.last_message    || "",
            last_message_at: row.last_message_at || null,
            unread_count:    parseInt(row.unread_count),
            matched_at:      row.matched_at,
        }));

        res.json({ matches });
    } catch (err) {
        console.error("getMutualMatches error:", err.message);
        res.status(500).json({ error: "Failed to fetch mutual matches." });
    }
};