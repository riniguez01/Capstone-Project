//every remaining candidate is scored. The scoring model assigns weighted values across multiple attributes.
    function getAge(dob) {
    return new Date().getFullYear() - new Date(dob).getFullYear();
}

//evaluates compatibility across six dimensions and produces a composite compatibility score used for ranking
module.exports = function scoreMatch(userA, userB) {
    let totalScore = 0;
    const breakdown = {};

    // AGE (0–15)
    const ageDiff = Math.abs(getAge(userA.date_of_birth) - getAge(userB.date_of_birth));
    const ageScore = Math.max(0, 15 - ageDiff);
    breakdown.age = ageScore;
    totalScore += ageScore;

    // INTERESTS (0–20)
    const shared = userA.interests.filter(i => userB.interests.includes(i));
    const interestScore = Math.min(20, shared.length * 5);
    breakdown.interests = interestScore;
    totalScore += interestScore;

    // ACTIVITY (0–10)
    const activityScore = userA.activity_level === userB.activity_level ? 10 : 0;
    breakdown.activity = activityScore;
    totalScore += activityScore;

    // RELIGION (0–15)
    const religionScore = userA.religion_id === userB.religion_id ? 15 : 0;
    breakdown.religion = religionScore;
    totalScore += religionScore;

    // DISTANCE (0–15)
    const distanceScore = userA.location_state === userB.location_state ? 15 : 5;
    breakdown.distance = distanceScore;
    totalScore += distanceScore;

    // TRUST (0–10)
    const trustScore = Math.min(10, userB.trust_score / 10);
    breakdown.trust = trustScore;
    totalScore += trustScore;

    return { totalScore, breakdown };
};