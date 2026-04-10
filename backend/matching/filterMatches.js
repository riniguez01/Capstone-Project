const TRUST_ELIMINATION_THRESHOLD = 40;

function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob   = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function milesBetween(lat1, lon1, lat2, lon2) {
    if (
        lat1 === null || lat1 === undefined ||
        lon1 === null || lon1 === undefined ||
        lat2 === null || lat2 === undefined ||
        lon2 === null || lon2 === undefined
    ) return null;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.7613;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function genderMatch(user, candidate) {
    const preferred = user.preferences?.preferred_genders || [];
    if (preferred.length === 0) return true;
    return preferred.includes(candidate.gender_identity);
}

function mutualGenderMatch(user, candidate) {
    if (!genderMatch(user, candidate)) return false;
    const candidatePreferred = candidate.preferences?.preferred_genders || [];
    if (candidatePreferred.length === 0) return true;
    return candidatePreferred.includes(user.gender_identity);
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

function distanceCompatible(user, candidate, prefs) {
    const min = prefs?.min_distance_miles;
    const max = prefs?.max_distance_miles;
    if ((min === null || min === undefined) && (max === null || max === undefined)) return true;
    const dist = milesBetween(user.latitude, user.longitude, candidate.latitude, candidate.longitude);
    if (dist === null) return true;
    if (min !== null && min !== undefined && dist < min) return false;
    if (max !== null && max !== undefined && dist > max) return false;
    return true;
}

module.exports = function filterMatches(user, candidates) {
    const prefs = user.preferences;

    return candidates.filter(candidate => {

        if (candidate.trust_score !== null &&
            candidate.trust_score !== undefined &&
            candidate.trust_score <= TRUST_ELIMINATION_THRESHOLD) {
            return false;
        }

        if (candidate.account_status !== 'active') return false;

        if (!prefs) return true;

        const candidateAge = getAge(candidate.date_of_birth);
        if (prefs.preferred_age_min && candidateAge !== null) {
            if (candidateAge < prefs.preferred_age_min) return false;
        }
        if (prefs.preferred_age_max && candidateAge !== null) {
            if (candidateAge > prefs.preferred_age_max) return false;
        }

        if (!mutualGenderMatch(user, candidate)) return false;

        if (prefs.preferred_height_min && candidate.height_inches !== null && candidate.height_inches !== undefined) {
            if (candidate.height_inches < prefs.preferred_height_min) return false;
        }
        if (prefs.preferred_height_max && candidate.height_inches !== null && candidate.height_inches !== undefined) {
            if (candidate.height_inches > prefs.preferred_height_max) return false;
        }

        if (prefs.preferred_religion_type_id && prefs.preferred_religion_type_id !== 1) {
            if (!candidate.religion_id || candidate.religion_id !== prefs.preferred_religion_type_id) return false;
        }

        if (prefs.preferred_political_affil && prefs.preferred_political_affil !== 1) {
            if (!candidate.political || candidate.political !== prefs.preferred_political_affil) return false;
        }

        if (prefs.preferred_ethnicity_id && prefs.preferred_ethnicity_id !== 1) {
            if (!candidate.ethnicity_id || candidate.ethnicity_id !== prefs.preferred_ethnicity_id) return false;
        }

        if (prefs.preferred_dating_goals && prefs.preferred_dating_goals !== 1) {
            if (!datingGoalsCompatible(prefs.preferred_dating_goals, candidate.dating_goals)) return false;
        } else {
            if (!datingGoalsCompatible(user.dating_goals, candidate.dating_goals)) return false;
        }

        if (prefs.preferred_want_children && prefs.preferred_want_children !== 1) {
            if (!childrenCompatible(prefs.preferred_want_children, candidate.children)) return false;
        } else {
            if (!childrenCompatible(user.children, candidate.children)) return false;
        }

        if (!distanceCompatible(user, candidate, prefs)) return false;

        return true;
    });
};