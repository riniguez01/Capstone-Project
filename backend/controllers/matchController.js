// matchController.js
// Handles HTTP requests for the matching feature.
// GET /matches/all     — returns all active candidates (no filtering)
// GET /matches/:userId — runs the full matching pipeline for a user

const generateMatches = require("../services/matchingService");
const { getUserById, getCandidates } = require("../services/userService");

// GET /matches/all — all active candidates (used for testing/admin)
exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await getCandidates(0);
        res.json(candidates);
    } catch (err) {
        console.error("getAllCandidates error:", err.message);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};

// GET /matches/:userId?ranked=true
exports.getMatches = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });

        const shouldRank = req.query.ranked !== "false"; // ranked by default

        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.preferences) return res.status(400).json({ error: "User has no preferences set" });

        const candidates = await getCandidates(userId);
        const matches = await generateMatches(user, candidates, shouldRank);

        // Enrich each match result with display fields
        const fullMatches = matches.map(match => {
            const candidate = candidates.find(c => c.user_id === match.user_id);
            return {
                user_id: match.user_id,
                first_name: candidate?.first_name || null,
                last_name: candidate?.last_name || null,
                location_city: candidate?.location_city || null,
                location_state: candidate?.location_state || null,
                score: match.score,
                raw_score: match.raw_score,
                trust_penalized: match.trust_penalized,
                breakdown: match.breakdown
            };
        });

        res.json({
            user_id: userId,
            total_matches: fullMatches.length,
            matches: fullMatches
        });

    } catch (err) {
        console.error("getMatches error:", err.message);
        res.status(500).json({ error: "Failed to generate matches" });
    }
};