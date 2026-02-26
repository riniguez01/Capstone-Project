//This removes candidates that violate user preferences.
//AKA all preferences must equal mock user's info. Enforces non-negotiable user preferences before scoring begins
function getAge(dob) {
    const today = new Date();
    const birth = new Date(dob);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

module.exports = function filterMatches(user, candidates) {
    return candidates.filter(candidate => {

        const age = getAge(candidate.date_of_birth);

        // Age
        if (age < user.preferences.preferred_age_min || age > user.preferences.preferred_age_max)
            return false;

        // Gender
        if (candidate.gender_identity !== user.preferences.preferred_gender)
            return false;

        // Religion
        if (candidate.religion_id !== user.preferences.preferred_religion_type_id)
            return false;

        // Trust; must be greater than 40
        if (candidate.trust_score < 40)
            return false;

        // Distance
        if (!user.preferences.preferred_distance_states.includes(candidate.location_state))
            return false;

        return true;
    });
};
