const filterMatches = require("../matching/filterMatches");
const rankMatches   = require("../matching/rankMatches");
const scoreMatch    = require("../matching/scoreMatch");
const pool          = require("../config/db");

async function attachCandidatePreferences(candidates) {
    return Promise.all(candidates.map(async (candidate) => {
        const result = await pool.query(
            `SELECT
                p.preference_id,
                p.preferred_age_min,
                p.preferred_age_max,
                p.preferred_dating_goals,
                p.preferred_want_children,
                p.preferred_smoking,
                p.preferred_height_min,
                p.preferred_height_max,
                p.preferred_religion_type_id,
                p.preferred_ethnicity_id,
                p.preferred_political_affil,
                array_agg(pg.gender_type_id) FILTER (WHERE pg.gender_type_id IS NOT NULL) AS preferred_genders
             FROM preferences p
             LEFT JOIN preference_genders pg ON pg.preference_id = p.preference_id
             WHERE p.user_id = $1
             GROUP BY p.preference_id`,
            [candidate.user_id]
        );

        return {
            ...candidate,
            preferences: result.rows[0] || null
        };
    }));
}

module.exports = async function generateMatches(user, candidates, shouldRank = true) {

    const candidatesWithPrefs = await attachCandidatePreferences(candidates);

    const filtered = filterMatches(user, candidatesWithPrefs);

    if (!shouldRank) {
        return filtered.map(candidate => {
            const result = scoreMatch(user, candidate);
            return {
                user_id:         candidate.user_id,
                score:           Math.round(result.totalScore),
                raw_score:       Math.round(result.totalScore),
                trust_penalized: false,
                breakdown:       result.breakdown
            };
        });
    }

    return rankMatches(user, filtered);
};