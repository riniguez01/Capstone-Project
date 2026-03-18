// matchController.js
// Handles HTTP requests for the matching feature.
// GET /matches/all          — returns all active candidates (no filtering)
// GET /matches/:userId      — runs the full matching pipeline for a user
// POST /matches/:userId/like — records a like/heart with tier limit enforcement

const generateMatches = require("../services/matchingService");
const { getUserById, getCandidates } = require("../services/userService");
const pool = require("../config/db");

// Default placeholder shown when a user has no profile photo
// Uses ui-avatars.com — no account needed, always returns a valid image URL
const DEFAULT_PHOTO = "https://ui-avatars.com/api/?background=c94b5b&color=fff&size=300&name=Aura";

// Like limits per tier (matches subscription_tiers table)
// free tier_id=1: 3 likes/day, premium tier_id=2: 5 likes/day
const LIKE_LIMITS = { 1: 3, 2: 5 };

// ─── HELPER: Calculate age from date_of_birth ──────────────────────────────
function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

// ─── HELPER: Scale trust_score (0–100) to star rating (1–5) ───────────────
// trust_score <= 20 already eliminated, effective range is 21–100
// Stars: 21-40 → 1, 41-55 → 2, 56-70 → 3, 71-85 → 4, 86-100 → 5
function trustToStars(trustScore) {
    if (trustScore === null || trustScore === undefined) return 3;
    if (trustScore <= 40) return 1;
    if (trustScore <= 55) return 2;
    if (trustScore <= 70) return 3;
    if (trustScore <= 85) return 4;
    return 5;
}

// ─── HELPER: Count how many likes a user has sent today ───────────────────
async function getLikesToday(userId) {
    const result = await pool.query(
        `SELECT COUNT(*) AS count
         FROM swipes
         WHERE swipe_user_id = $1
           AND swipe_type = 'like'
           AND created_at >= NOW() - INTERVAL '24 hours'`,
        [userId]
    );
    return parseInt(result.rows[0].count);
}

// ─── GET /matches/all — all active candidates (testing/admin) ──────────────
exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await getCandidates(0);
        res.json(candidates);
    } catch (err) {
        console.error("getAllCandidates error:", err.message);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};

// ─── GET /matches/:userId ──────────────────────────────────────────────────
exports.getMatches = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });

        const shouldRank = req.query.ranked !== "false";

        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.preferences) return res.status(400).json({ error: "User has no preferences set" });

        const candidates = await getCandidates(userId);
        const matches = await generateMatches(user, candidates, shouldRank);

        // How many likes has this user sent today (for frontend to show remaining hearts)
        const likesToday = await getLikesToday(userId);
        const tierLimit  = LIKE_LIMITS[user.tier_id] || 3;
        const likesLeft  = Math.max(0, tierLimit - likesToday);

        // Enrich each match with fields Alex's frontend expects:
        // { name, location, age, gender, starRating, image }
        const fullMatches = matches.map(match => {
            const candidate = candidates.find(c => c.user_id === match.user_id);
            return {
                user_id:         match.user_id,
                name:            candidate ? `${candidate.first_name} ${candidate.last_name}`.trim() : null,
                first_name:      candidate?.first_name || null,
                last_name:       candidate?.last_name  || null,
                age:             getAge(candidate?.date_of_birth),
                gender:          candidate?.gender_name || null,
                location:        candidate?.location_city
                    ? `${candidate.location_city}, ${candidate.location_state || ""}`.trim().replace(/,$/, "")
                    : null,
                location_city:   candidate?.location_city  || null,
                location_state:  candidate?.location_state || null,
                image:           candidate?.profile_photo_url || `https://ui-avatars.com/api/?background=c94b5b&color=fff&size=300&name=${encodeURIComponent((candidate?.first_name || "") + "+" + (candidate?.last_name || ""))}`,
                starRating:      trustToStars(candidate?.trust_score),
                score:           match.score,
                raw_score:       match.raw_score,
                trust_penalized: match.trust_penalized,
                breakdown:       match.breakdown
            };
        });

        res.json({
            user_id:       userId,
            total_matches: fullMatches.length,
            likes_today:   likesToday,
            likes_left:    likesLeft,
            tier_limit:    tierLimit,
            matches:       fullMatches
        });
    } catch (err) {
        console.error("getMatches error:", err.message);
        res.status(500).json({ error: "Failed to generate matches" });
    }
};

// ─── POST /matches/:userId/like ────────────────────────────────────────────
// Called when Alex's frontend hearts a match card.
// Enforces daily like limit based on subscription tier.
// Body: { liked_user_id }
exports.likeUser = async (req, res) => {
    try {
        const userId      = parseInt(req.params.userId);
        const likedUserId = parseInt(req.body.liked_user_id);

        if (isNaN(userId) || isNaN(likedUserId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        if (userId === likedUserId) {
            return res.status(400).json({ error: "You cannot like yourself" });
        }

        // Get user's tier to determine their daily limit
        const userResult = await pool.query(
            "SELECT tier_id FROM users WHERE user_id = $1",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const tierId     = userResult.rows[0].tier_id || 1;
        const tierLimit  = LIKE_LIMITS[tierId] || 3;
        const likesToday = await getLikesToday(userId);

        // Enforce daily like limit
        if (likesToday >= tierLimit) {
            return res.status(429).json({
                error:      "Daily like limit reached.",
                likes_used: likesToday,
                tier_limit: tierLimit,
                resets_in:  "24 hours"
            });
        }

        // Check if already liked
        const existing = await pool.query(
            `SELECT swipe_id FROM swipes
             WHERE swipe_user_id = $1 AND swiped_user_id = $2 AND swipe_type = 'like'`,
            [userId, likedUserId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Already liked this user" });
        }

        // Record the like in swipes table
        await pool.query(
            `INSERT INTO swipes (swipe_user_id, swiped_user_id, swipe_type, created_at)
             VALUES ($1, $2, 'like', NOW())`,
            [userId, likedUserId]
        );

        // Check for mutual like — if they already liked us back, create a match
        const mutualLike = await pool.query(
            `SELECT swipe_id FROM swipes
             WHERE swipe_user_id = $1 AND swiped_user_id = $2 AND swipe_type = 'like'`,
            [likedUserId, userId]
        );

        let matchCreated = false;
        if (mutualLike.rows.length > 0) {
            // user1_id is always the lower ID to satisfy Beka's unique index on (user1_id, user2_id)
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
            tier_limit:    tierLimit
        });
    } catch (err) {
        console.error("likeUser error:", err.message);
        res.status(500).json({ error: "Failed to record like" });
    }
};