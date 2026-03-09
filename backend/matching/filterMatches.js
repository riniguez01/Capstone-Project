// filterMatches.js
// Stage 1 of the matching pipeline — hard constraint filtering.
// Any candidate who fails a single constraint is removed immediately and never scored.
// All field references match the actual database schema.

const TRUST_ELIMINATION_THRESHOLD = 20; // trust_score <= 20 → removed entirely (1 star and below)

// ─── HELPER: Calculate age from date_of_birth ──────────────────────────────
function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

// ─── HELPER: Check mutual gender preference ────────────────────────────────
// user wants candidate's gender AND candidate wants user's gender
function mutualGenderMatch(user, candidate) {
    const userPreferredGenders = user.preferences?.preferred_genders || [];
    const candidatePreferredGenders = candidate.preferences?.preferred_genders || [];

    // If either has no preference set, skip this constraint
    if (userPreferredGenders.length === 0 || candidatePreferredGenders.length === 0) return true;

    const userWantsCandidate = userPreferredGenders.includes(candidate.gender_identity);
    const candidateWantsUser = candidatePreferredGenders.includes(user.gender_identity);

    return userWantsCandidate && candidateWantsUser;
}

// ─── HELPER: Dating goals compatibility ────────────────────────────────────
// Casual(1) ≠ Long-term(3) is a hard mismatch per feature spec
// Serious(2) is compatible with Long-term(3) but not Casual(1)
function datingGoalsCompatible(userGoal, candidateGoal) {
    if (!userGoal || !candidateGoal) return true; // no preference set, skip
    if (userGoal === candidateGoal) return true;

    // Serious(2) and Long-term(3) are compatible
    const longTermGroup = [2, 3];
    if (longTermGroup.includes(userGoal) && longTermGroup.includes(candidateGoal)) return true;

    return false;
}

// ─── HELPER: Children preference compatibility ─────────────────────────────
// Want kids(1) vs Don't want kids(3) is a hard mismatch
// Have kids(2) and Open(4) are flexible
function childrenCompatible(userChildren, candidateChildren) {
    if (!userChildren || !candidateChildren) return true;

    // "Open" is compatible with everything
    if (userChildren === 4 || candidateChildren === 4) return true;

    // "Want kids" and "Don't want kids" are incompatible
    if ((userChildren === 1 && candidateChildren === 3) ||
        (userChildren === 3 && candidateChildren === 1)) return false;

    return true;
}

// ─── MAIN FILTER FUNCTION ──────────────────────────────────────────────────
module.exports = function filterMatches(user, candidates) {
    const prefs = user.preferences;
    const userAge = getAge(user.date_of_birth);

    return candidates.filter(candidate => {
        const candidateAge = getAge(candidate.date_of_birth);

        // ── 1. TRUST SCORE ELIMINATION ──────────────────────────────────────
        // Users at or below 20 internal score are never shown
        if (candidate.trust_score !== null &&
            candidate.trust_score !== undefined &&
            candidate.trust_score <= TRUST_ELIMINATION_THRESHOLD) {
            return false;
        }

        // ── 2. ACCOUNT STATUS ───────────────────────────────────────────────
        // Already filtered in SQL but double-check here
        if (candidate.account_status !== 'active') return false;

        // ── 3. SKIP IF NO PREFERENCES SET ──────────────────────────────────
        if (!prefs) return true; // no prefs = no hard filters applied

        // ── 4. AGE RANGE ────────────────────────────────────────────────────
        if (prefs.preferred_age_min && candidateAge !== null) {
            if (candidateAge < prefs.preferred_age_min) return false;
        }
        if (prefs.preferred_age_max && candidateAge !== null) {
            if (candidateAge > prefs.preferred_age_max) return false;
        }

        // ── 5. MUTUAL GENDER PREFERENCE ─────────────────────────────────────
        if (!mutualGenderMatch(user, candidate)) return false;

        // ── 6. HEIGHT RANGE ──────────────────────────────────────────────────
        if (prefs.preferred_height_min && candidate.height_cm !== null) {
            if (candidate.height_cm < prefs.preferred_height_min) return false;
        }
        if (prefs.preferred_height_max && candidate.height_cm !== null) {
            if (candidate.height_cm > prefs.preferred_height_max) return false;
        }

        // ── 7. DATING GOALS ──────────────────────────────────────────────────
        if (!datingGoalsCompatible(user.dating_goals, candidate.dating_goals)) return false;

        // ── 8. CHILDREN ──────────────────────────────────────────────────────
        if (!childrenCompatible(user.children, candidate.children)) return false;

        // ── 9. SMOKING ───────────────────────────────────────────────────────
        // Only apply if user has set a smoking preference
        if (prefs.preferred_smoking && candidate.smoking_id) {
            if (prefs.preferred_smoking !== candidate.smoking_id) return false;
        }

        // ── 10. DISTANCE (state-based approximation) ─────────────────────────
        // Full distance filtering requires lat/lon math — for now filter by state
        // This can be upgraded to haversine formula once location data is confirmed
        // No hard filter here — distance is handled at candidate pool generation level

        return true;
    });
};