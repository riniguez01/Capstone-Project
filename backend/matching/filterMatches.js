// filterMatches.js
// Stage 1 of the matching pipeline — hard constraint filtering.
//
// SPRINT 2 FIXES:
// - height_cm renamed to height_inches (v4 migration)
// - Gender check is now one-directional (what the logged-in user wants)
// - Added location_state filter
// - Trust elimination threshold raised to 30

const TRUST_ELIMINATION_THRESHOLD = 30;

function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function genderMatch(user, candidate) {
    const userPreferredGenders = user.preferences?.preferred_genders || [];
    if (userPreferredGenders.length === 0) return true;
    return userPreferredGenders.includes(candidate.gender_identity);
}

function datingGoalsCompatible(userGoal, candidateGoal) {
    if (!userGoal || !candidateGoal) return true;
    if (userGoal === candidateGoal) return true;
    const longTermGroup = [2, 3];
    if (longTermGroup.includes(userGoal) && longTermGroup.includes(candidateGoal)) return true;
    return false;
}

function childrenCompatible(userChildren, candidateChildren) {
    if (!userChildren || !candidateChildren) return true;
    if (userChildren === 4 || candidateChildren === 4) return true;
    if ((userChildren === 1 && candidateChildren === 3) ||
        (userChildren === 3 && candidateChildren === 1)) return false;
    return true;
}

module.exports = function filterMatches(user, candidates) {
    const prefs = user.preferences;

    return candidates.filter(candidate => {
        const candidateAge = getAge(candidate.date_of_birth);

        if (candidate.trust_score !== null &&
            candidate.trust_score !== undefined &&
            candidate.trust_score <= TRUST_ELIMINATION_THRESHOLD) {
            return false;
        }

        if (candidate.account_status !== 'active') return false;

        if (user.location_state && candidate.location_state) {
            if (user.location_state !== candidate.location_state) return false;
        }

        if (!prefs) return true;

        if (prefs.preferred_age_min && candidateAge !== null) {
            if (candidateAge < prefs.preferred_age_min) return false;
        }
        if (prefs.preferred_age_max && candidateAge !== null) {
            if (candidateAge > prefs.preferred_age_max) return false;
        }

        if (!genderMatch(user, candidate)) return false;

        if (prefs.preferred_height_min && candidate.height_inches !== null) {
            if (candidate.height_inches < prefs.preferred_height_min) return false;
        }
        if (prefs.preferred_height_max && candidate.height_inches !== null) {
            if (candidate.height_inches > prefs.preferred_height_max) return false;
        }

        if (!datingGoalsCompatible(user.dating_goals, candidate.dating_goals)) return false;

        if (!childrenCompatible(user.children, candidate.children)) return false;

        return true;
    });
};
