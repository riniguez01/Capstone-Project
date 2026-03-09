// rankMatches.js
// Stage 3 of the matching pipeline — score every filtered candidate and sort.
// trust_score here refers to internal_score from the trust_score table,
// joined as trust_score in userService.js queries.

const scoreMatch = require("./scoreMatch");

const TRUST_PENALTY_THRESHOLD = 40; // internal_score 21–40 → ranking penalty applied
const TRUST_PENALTY_AMOUNT    = 15; // points deducted from adjusted score

module.exports = function rankMatches(user, filteredCandidates) {
    return filteredCandidates
        .map(candidate => {
            const result = scoreMatch(user, candidate);
            let adjustedScore = result.totalScore;

            // Apply ranking penalty for low-trust candidates (score 21–40)
            // Candidates at or below 20 were already eliminated in filterMatches
            const trustScore = candidate.trust_score;
            const isPenalized = trustScore !== null &&
                trustScore !== undefined &&
                trustScore <= TRUST_PENALTY_THRESHOLD;

            if (isPenalized) {
                adjustedScore = Math.max(0, adjustedScore - TRUST_PENALTY_AMOUNT);
            }

            return {
                user_id: candidate.user_id,
                score: Math.round(adjustedScore),
                raw_score: Math.round(result.totalScore),
                trust_penalized: isPenalized,
                breakdown: result.breakdown
            };
        })
        .sort((a, b) => b.score - a.score);
};