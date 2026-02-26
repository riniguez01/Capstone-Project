//Matches are sorted descending by score
module.exports = function rankMatches(user, candidates) {
    const scoreMatch = require("./scoreMatch");

    const scored = candidates.map(candidate => {
        const result = scoreMatch(user, candidate);
        return {
            user_id: candidate.user_id,
            score: result.totalScore,
            breakdown: result.breakdown
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
};