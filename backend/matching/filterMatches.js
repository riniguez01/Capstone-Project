const TRUST_ELIMINATION_THRESHOLD = 30;

function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const dob   = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R    = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validCoord(lat, lon) {
    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    return !isNaN(la) && !isNaN(lo) && la !== 0 && lo !== 0;
}

function genderMatch(user, candidate) {
    const preferred = user.preferences?.preferred_genders || [];
    if (preferred.length === 0) return true;
    return preferred.includes(candidate.gender_identity);
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

    const userHasCoords = validCoord(user.latitude, user.longitude);
    const maxMiles = prefs?.max_distance_miles || 100;

    return candidates.filter(candidate => {

        if (candidate.trust_score !== null &&
            candidate.trust_score !== undefined &&
            candidate.trust_score <= TRUST_ELIMINATION_THRESHOLD) return false;

        if (candidate.account_status !== 'active') return false;

        if (userHasCoords && validCoord(candidate.latitude, candidate.longitude)) {
            const dist = haversineDistance(
                parseFloat(user.latitude), parseFloat(user.longitude),
                parseFloat(candidate.latitude), parseFloat(candidate.longitude)
            );
            if (dist > maxMiles) return false;
        }

        if (!prefs) return true;

        const candidateAge = getAge(candidate.date_of_birth);
        if (prefs.preferred_age_min && candidateAge !== null) {
            if (candidateAge < prefs.preferred_age_min) return false;
        }
        if (prefs.preferred_age_max && candidateAge !== null) {
            if (candidateAge > prefs.preferred_age_max) return false;
        }

        if (!genderMatch(user, candidate)) return false;

        if (prefs.preferred_height_min && candidate.height_inches != null) {
            if (candidate.height_inches < prefs.preferred_height_min) return false;
        }
        if (prefs.preferred_height_max && candidate.height_inches != null) {
            if (candidate.height_inches > prefs.preferred_height_max) return false;
        }

        if (!datingGoalsCompatible(user.dating_goals, candidate.dating_goals)) return false;

        if (!childrenCompatible(user.children, candidate.children)) return false;

        return true;
    });
};