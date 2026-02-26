// Matching Pipeline (Core Logic) 3-stage pipeline:Filter , Score, Sort
const filterMatches = require("../matching/filterMatches");
const rankMatches = require("../matching/rankMatches");
const scoreMatch = require("../matching/scoreMatch");

//When “Show Matches” Is Clicked frontend gets called
module.exports = function generateMatches(user, candidates, shouldRank = true) {

    const filtered = filterMatches(user, candidates);

    // If ranking is OFF → still score, just don't sort
    if (!shouldRank) {

        return filtered.map(candidate => {
            const result = scoreMatch(user, candidate);

            return {
                user_id: candidate.user_id,
                score: result.totalScore,
                breakdown: result.breakdown
            };
        });

    }

    // Ranking ON → score + sort
    return rankMatches(user, filtered);
};