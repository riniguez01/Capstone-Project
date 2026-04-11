const { ni } = require("../utils/pgCoerce");
const { normalizePreferredGenderIds } = require("./preferredGenderIds");

const TRUST_ELIMINATION_THRESHOLD = 40;

function normalizeGenderIdList(raw) {
    return normalizePreferredGenderIds(raw);
}

function partnerFieldOpen(label) {
    return label == null || label === "" || label === "No preference";
}

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
    const preferred = normalizeGenderIdList(user.preferences?.preferred_genders);
    if (preferred.length === 0) return true;
    const cg = ni(candidate.gender_identity);
    if (cg === null) return false;
    return preferred.includes(cg);
}

function mutualGenderMatch(user, candidate) {
    if (!genderMatch(user, candidate)) return false;
    const candidatePreferred = normalizeGenderIdList(candidate.preferences?.preferred_genders);
    if (candidatePreferred.length === 0) return true;
    const ug = ni(user.gender_identity);
    if (ug === null) return false;
    return candidatePreferred.includes(ug);
}

function datingGoalsCompatible(uGoal, cGoal, uName, cName) {
    if (uName === "No preference" || cName === "No preference") return true;
    const u = ni(uGoal);
    const c = ni(cGoal);
    if (u === null || c === null) return true;
    if (u === c) return true;
    const seriousGroup = [2, 3];
    if (seriousGroup.includes(u) && seriousGroup.includes(c)) return true;
    return false;
}

/** Pairwise want-children compatibility using lookup ids + labels (ids differ per DB seed order). */
function wantChildrenPairCompatible(aId, bId, aLabel, bLabel) {
    if (aLabel === "No preference" || bLabel === "No preference") return true;
    const u = ni(aId);
    const c = ni(bId);
    if (u === null || c === null) return true;
    if (u === c) return true;
    if (u === 4 || c === 4) return true;
    if ((u === 1 && c === 3) || (u === 3 && c === 1)) return false;
    if ((u === 2 && c === 3) || (u === 3 && c === 2)) return false;
    return true;
}

function distanceCompatible(user, candidate, prefs) {
    const min = ni(prefs?.min_distance_miles);
    const max = ni(prefs?.max_distance_miles);
    if (min === null && max === null) return true;
    const dist = milesBetween(user.latitude, user.longitude, candidate.latitude, candidate.longitude);
    if (dist === null) return true;
    if (min !== null && dist < min) return false;
    if (max !== null && dist > max) return false;
    return true;
}

module.exports = function filterMatches(user, candidates) {
    const prefs = user.preferences;

    return candidates.filter(candidate => {

        const trust = ni(candidate.trust_score);
        if (trust !== null && trust <= TRUST_ELIMINATION_THRESHOLD) {
            return false;
        }

        if (candidate.account_status !== "active") return false;

        if (!mutualGenderMatch(user, candidate)) return false;

        if (!prefs) return true;

        const candidateAge = getAge(candidate.date_of_birth);
        const ageMin = ni(prefs.preferred_age_min);
        const ageMax = ni(prefs.preferred_age_max);
        if (ageMin !== null && candidateAge !== null && candidateAge < ageMin) return false;
        if (ageMax !== null && candidateAge !== null && candidateAge > ageMax) return false;

        const hMin = ni(prefs.preferred_height_min);
        const hMax = ni(prefs.preferred_height_max);
        const ch = ni(candidate.height_inches);
        if (hMin !== null && ch !== null && ch < hMin) return false;
        if (hMax !== null && ch !== null && ch > hMax) return false;

        if (!partnerFieldOpen(prefs.preferred_religion_label)) {
            const prefRel = ni(prefs.preferred_religion_type_id);
            const cr = ni(candidate.religion_id);
            if (cr === null || cr !== prefRel) return false;
        }

        if (!partnerFieldOpen(prefs.preferred_political_label)) {
            const prefPol = ni(prefs.preferred_political_affil);
            const cp = ni(candidate.political);
            if (cp === null || cp !== prefPol) return false;
        }

        if (!partnerFieldOpen(prefs.preferred_ethnicity_label)) {
            const prefEth = ni(prefs.preferred_ethnicity_id);
            const ce = ni(candidate.ethnicity_id);
            if (ce === null || ce !== prefEth) return false;
        }

        if (!partnerFieldOpen(prefs.preferred_dating_goals_label)) {
            if (!datingGoalsCompatible(
                prefs.preferred_dating_goals,
                candidate.dating_goals,
                prefs.preferred_dating_goals_label,
                candidate.dating_goals_name
            )) return false;
        } else {
            if (!datingGoalsCompatible(
                user.dating_goals,
                candidate.dating_goals,
                user.dating_goals_name,
                candidate.dating_goals_name
            )) return false;
        }

        if (!partnerFieldOpen(prefs.preferred_want_children_label)) {
            if (!wantChildrenPairCompatible(
                prefs.preferred_want_children,
                candidate.children,
                prefs.preferred_want_children_label,
                candidate.children_name
            )) return false;
        } else {
            if (!wantChildrenPairCompatible(
                user.children,
                candidate.children,
                user.children_name,
                candidate.children_name
            )) return false;
        }

        if (!partnerFieldOpen(prefs.preferred_family_oriented_label)) {
            const prefFam = ni(prefs.preferred_family_oriented);
            const cf = ni(candidate.family_oriented);
            if (cf === null || cf !== prefFam) return false;
        }

        if (!distanceCompatible(user, candidate, prefs)) return false;

        return true;
    });
};
