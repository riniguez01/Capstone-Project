const AMBIVERT_ID = 3;

function clamp01(x) {
    if (x === null || x === undefined) return 0;
    return Math.max(0, Math.min(1, x));
}

function eq(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return null;
    return a === b ? 1 : 0;
}

function ordinal3(a, b) {
    if (!a || !b) return null;
    const diff = Math.abs(a - b);
    if (diff === 0) return 1;
    if (diff === 1) return 0.5;
    return 0;
}

function personalityCompat(a, b) {
    if (!a || !b) return null;
    if (a === AMBIVERT_ID || b === AMBIVERT_ID) return 0.8;
    if (a === b) return 1;
    return 0.4;
}

function avg(parts) {
    const nums = parts.filter((p) => p !== null);
    if (nums.length === 0) return 0;
    return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function scoreInterests(userA, userB) {
    const music = eq(userA.music, userB.music);
    const travel = ordinal3(userA.travel, userB.travel);
    const pets = eq(userA.pet_interest, userB.pet_interest);
    const reader = eq(userA.reader, userB.reader);
    const gamer = eq(userA.gamer, userB.gamer);
    return clamp01(avg([music, travel, pets, reader, gamer]));
}

function scoreLifestyle(userA, userB) {
    const activity = ordinal3(userA.activity_level, userB.activity_level);
    const drinking = ordinal3(userA.drinking_id, userB.drinking_id);
    const smoking = ordinal3(userA.smoking_id, userB.smoking_id);
    const diet = eq(userA.diet_id, userB.diet_id);
    const coffee = eq(userA.coffee_id, userB.coffee_id);
    return clamp01(avg([activity, drinking, smoking, diet, coffee]));
}

function scorePersonality(userA, userB) {
    return clamp01(personalityCompat(userA.personality_type, userB.personality_type));
}

function scoreValuesAndRelationship(userA, userB) {
    const religion = eq(userA.religion_id, userB.religion_id);
    const familyOriented = eq(userA.family_oriented, userB.family_oriented);
    const political = ordinal3(userA.political, userB.political);
    const datingGoals = eq(userA.dating_goals, userB.dating_goals);
    const children = eq(userA.children, userB.children);
    return clamp01(avg([religion, familyOriented, political, datingGoals, children]));
}

module.exports = function scoreMatch(userA, userB) {
    const interests = scoreInterests(userA, userB);
    const lifestyle = scoreLifestyle(userA, userB);
    const personality = scorePersonality(userA, userB);
    const values = scoreValuesAndRelationship(userA, userB);

    const weights = { interests: 0.25, lifestyle: 0.25, personality: 0.2, values: 0.3 };
    const totalScore01 =
        interests * weights.interests +
        lifestyle * weights.lifestyle +
        personality * weights.personality +
        values * weights.values;

    const totalScore = Math.round(clamp01(totalScore01) * 100);

    return {
        totalScore,
        breakdown: {
            interests: Math.round(interests * 100),
            lifestyle: Math.round(lifestyle * 100),
            personality: Math.round(personality * 100),
            values: Math.round(values * 100),
            weights
        }
    };
};