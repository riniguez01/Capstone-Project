// scoreMatch.js
// Stage 2 of the matching pipeline — weighted compatibility scoring.
// Evaluates 4 dimensions + trust bonus using integer IDs from the real DB schema.
// All column names match the users table exactly.
// Returns a totalScore (0–100) and a per-dimension breakdown.

// ─── LIFESTYLE DIMENSION (25 pts) ──────────────────────────────────────────
// Columns: drinking_id, diet_id, activity_level, coffee_id
function scoreLifestyle(userA, userB) {
    let score = 0;

    // Activity level — most important lifestyle signal (10 pts)
    // activity_level is an FK integer (Low=1, Medium=2, High=3)
    if (userA.activity_level && userB.activity_level) {
        const diff = Math.abs(userA.activity_level - userB.activity_level);
        if (diff === 0) score += 10;
        else if (diff === 1) score += 5;
    }

    // Drinking (7 pts)
    // drinking_id FK: Yes=1, No=2, Social=3
    if (userA.drinking_id && userB.drinking_id) {
        if (userA.drinking_id === userB.drinking_id) score += 7;
        else if (Math.abs(userA.drinking_id - userB.drinking_id) === 1) score += 3;
    }

    // Diet (5 pts)
    // diet_id FK: Omnivore=1, Vegetarian=2, Vegan=3, Other=4
    if (userA.diet_id && userB.diet_id) {
        if (userA.diet_id === userB.diet_id) score += 5;
    }

    // Coffee (3 pts)
    // coffee_id FK: Yes=1, No=2
    if (userA.coffee_id && userB.coffee_id) {
        if (userA.coffee_id === userB.coffee_id) score += 3;
    }

    return Math.min(25, score);
}

// ─── INTERESTS DIMENSION (25 pts) ──────────────────────────────────────────
// Columns: music, gamer, reader, travel, pet_interest
function scoreInterests(userA, userB) {
    let score = 0;

    // Music (8 pts) — music is the FK column name on users table
    if (userA.music && userB.music) {
        if (userA.music === userB.music) score += 8;
    }

    // Travel (7 pts) — travel FK: Love it=1, Occasionally=2, Not really=3
    if (userA.travel && userB.travel) {
        if (userA.travel === userB.travel) score += 7;
        else if (Math.abs(userA.travel - userB.travel) === 1) score += 3;
    }

    // Gamer (4 pts) — gamer FK: Yes=1, No=2, Casual=3
    if (userA.gamer && userB.gamer) {
        if (userA.gamer === userB.gamer) score += 4;
        else if (userA.gamer === 3 || userB.gamer === 3) score += 2; // one casual gamer
    }

    // Reader (3 pts) — reader FK: Yes=1, No=2, Occasionally=3
    if (userA.reader && userB.reader) {
        if (userA.reader === userB.reader) score += 3;
    }

    // Pet interest (3 pts)
    if (userA.pet_interest && userB.pet_interest) {
        if (userA.pet_interest === userB.pet_interest) score += 3;
    }

    return Math.min(25, score);
}

// ─── PERSONALITY DIMENSION (15 pts) ────────────────────────────────────────
// Column: personality_type FK — Introvert=1, Extrovert=2, Ambivert=3
function scorePersonality(userA, userB) {
    if (!userA.personality_type || !userB.personality_type) return 0;

    // Ambivert is compatible with everyone
    if (userA.personality_type === 3 || userB.personality_type === 3) return 12;

    // Same type = full match
    if (userA.personality_type === userB.personality_type) return 15;

    // Introvert + Extrovert = partial (opposites can attract)
    return 6;
}

// ─── VALUES DIMENSION (25 pts) ─────────────────────────────────────────────
// Columns: religion_id, family_oriented, political, dating_goals
function scoreValues(userA, userB) {
    let score = 0;

    // Religion (10 pts)
    // religion_id FK — Spiritual is loosely compatible with non-strict religions
    // Assuming Spiritual = 10 based on the dropdown order in feature spec
    if (userA.religion_id && userB.religion_id) {
        if (userA.religion_id === userB.religion_id) score += 10;
        else if (userA.religion_id === 10 || userB.religion_id === 10) score += 4; // Spiritual
    }

    // Family-oriented (8 pts)
    // family_oriented FK: Yes=1, No=2 — schema only has Yes/No per family_oriented table
    if (userA.family_oriented && userB.family_oriented) {
        if (userA.family_oriented === userB.family_oriented) score += 8;
    }

    // Political alignment (7 pts)
    // political FK: Liberal=1, Moderate=2, Conservative=3, Apolitical=4, Prefer not to say=5
    if (userA.political && userB.political) {
        const diff = Math.abs(userA.political - userB.political);
        if (diff === 0) score += 7;
        else if (diff === 1) score += 4; // one step apart
        else if (diff === 2) score += 1; // two steps apart
        // Apolitical(4) gets partial credit with anyone
        if (userA.political === 4 || userB.political === 4) score = Math.max(score, 4);
    }

    // Dating goals proximity bonus (scored here even though it's also a hard filter)
    // Rewards matching goals more precisely — Serious(2) + Long-term(3) gets partial credit
    if (userA.dating_goals && userB.dating_goals) {
        if (userA.dating_goals === userB.dating_goals) score += 0; // already max from filter pass
        // no additional points here — dating goals is primarily a hard constraint
    }

    return Math.min(25, score);
}

// ─── TRUST BONUS (10 pts) ──────────────────────────────────────────────────
// internal_score from trust_score table (0–100), joined as trust_score on candidate
function scoreTrust(candidate) {
    if (candidate.trust_score === null || candidate.trust_score === undefined) return 5; // neutral default
    return Math.round((candidate.trust_score / 100) * 10);
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
module.exports = function scoreMatch(userA, userB) {
    const lifestyle   = scoreLifestyle(userA, userB);
    const interests   = scoreInterests(userA, userB);
    const personality = scorePersonality(userA, userB);
    const values      = scoreValues(userA, userB);
    const trust       = scoreTrust(userB);

    const totalScore = lifestyle + interests + personality + values + trust;

    return {
        totalScore,
        breakdown: {
            lifestyle,
            interests,
            personality,
            values,
            trust
        }
    };
};