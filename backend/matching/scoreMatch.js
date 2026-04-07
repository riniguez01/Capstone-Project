// scoreMatch.js
// Stage 2 of the matching pipeline — weighted compatibility scoring.
// Evaluates 5 dimensions + trust bonus using integer IDs from the real DB schema.
// Returns a totalScore (0–100) and a per-dimension breakdown.
//
// ─── SEED DATA ALIGNMENT ──────────────────────────────────────────────────
// political_affil (IDs 1–6):
//   1=Very Liberal, 2=Liberal, 3=Moderate, 4=Conservative, 5=Very Conservative, 6=Apolitical
//
// religion_type (IDs 1–10):
//   1=Atheist, 2=Agnostic, 3=Buddhist, 4=Catholic, 5=Christian,
//   6=Hindu, 7=Jewish, 8=Mormon, 9=Muslim, 10=Spiritual (non-religious)
//
// drinking (IDs 1–3): 1=Yes, 2=No, 3=Social
// activity_level (IDs 1–3): 1=Low, 2=Medium, 3=High
// travel (IDs 1–3): 1=Love it, 2=Occasionally, 3=Not really
// gamer (IDs 1–3): 1=Yes, 2=No, 3=Casual
// smoking (IDs 1–3): 1=Yes, 2=No, 3=Occasionally
// personality_type (IDs 1–3): 1=Introvert, 2=Extrovert, 3=Ambivert
// ─────────────────────────────────────────────────────────────────────────

const POLITICAL_APOLITICAL_ID = 6;
const RELIGION_SPIRITUAL_ID   = 10;
const AMBIVERT_ID             = 3;

// ─── LIFESTYLE DIMENSION (25 pts) ──────────────────────────────────────────
// activity_level: 1=Low, 2=Medium, 3=High — ordinal distance valid
// drinking: 1=Yes, 2=No, 3=Social — partial credit for adjacent
// smoking: 1=Yes, 2=No, 3=Occasionally — partial for occasional
// diet_id / coffee_id: exact match only
function scoreLifestyle(userA, userB) {
    let score = 0;

    // Activity level — ordinal distance (max 10)
    if (userA.activity_level && userB.activity_level) {
        const diff = Math.abs(userA.activity_level - userB.activity_level);
        if (diff === 0) score += 10;
        else if (diff === 1) score += 5;
    }

    // Drinking — partial credit for adjacent values (max 6)
    if (userA.drinking_id && userB.drinking_id) {
        if (userA.drinking_id === userB.drinking_id) score += 6;
        else if (Math.abs(userA.drinking_id - userB.drinking_id) === 1) score += 3;
    }

    // Smoking — partial credit for occasional (max 4)
    if (userA.smoking_id && userB.smoking_id) {
        if (userA.smoking_id === userB.smoking_id) score += 4;
        else if (userA.smoking_id === 3 || userB.smoking_id === 3) score += 1;
    }

    // Diet — exact match only (max 3)
    if (userA.diet_id && userB.diet_id) {
        if (userA.diet_id === userB.diet_id) score += 3;
    }

    // Coffee — exact match only (max 2)
    if (userA.coffee_id && userB.coffee_id) {
        if (userA.coffee_id === userB.coffee_id) score += 2;
    }

    return Math.min(25, score);
}

// ─── INTERESTS DIMENSION (25 pts) ──────────────────────────────────────────
// music: exact match (8) — genre IDs, no ordinal meaning
// travel: 1=Love it, 2=Occasionally, 3=Not really — ordinal distance valid (7)
// pet_interest: exact match (3)
// reader: exact match (3)
// gamer: 1=Yes, 2=No, 3=Casual — partial for casual (4)
function scoreInterests(userA, userB) {
    let score = 0;

    // Music genre match — exact only (max 8)
    if (userA.music && userB.music) {
        if (userA.music === userB.music) score += 8;
    }

    // Travel — ordinal distance (max 7)
    if (userA.travel && userB.travel) {
        if (userA.travel === userB.travel) score += 7;
        else if (Math.abs(userA.travel - userB.travel) === 1) score += 3;
    }

    // Pet interest — exact match (max 3)
    if (userA.pet_interest && userB.pet_interest) {
        if (userA.pet_interest === userB.pet_interest) score += 3;
    }

    // Reader — exact match (max 3)
    if (userA.reader && userB.reader) {
        if (userA.reader === userB.reader) score += 3;
    }

    // Gamer — partial credit for casual (max 4)
    if (userA.gamer && userB.gamer) {
        if (userA.gamer === userB.gamer) score += 4;
        else if (userA.gamer === 3 || userB.gamer === 3) score += 2;
    }

    return Math.min(25, score);
}

// ─── PERSONALITY DIMENSION (15 pts) ────────────────────────────────────────
// 1=Introvert, 2=Extrovert, 3=Ambivert
// Ambivert is compatible with anyone (12 pts — close but not perfect)
// Same type = perfect (15 pts)
// Introvert + Extrovert = partial (6 pts — opposites can work)
function scorePersonality(userA, userB) {
    if (!userA.personality_type || !userB.personality_type) return 0;
    if (userA.personality_type === AMBIVERT_ID ||
        userB.personality_type === AMBIVERT_ID) return 12;
    if (userA.personality_type === userB.personality_type) return 15;
    return 6; // Introvert + Extrovert — opposite but viable
}

// ─── VALUES DIMENSION (25 pts) ─────────────────────────────────────────────
// religion: exact match (10), spiritual partial credit (4)
// family_oriented: exact match (8)
// political: ordinal distance with apolitical special case (7)
function scoreValues(userA, userB) {
    let score = 0;

    // Religion (max 10)
    if (userA.religion_id && userB.religion_id) {
        if (userA.religion_id === userB.religion_id) {
            score += 10;
        } else if (userA.religion_id === RELIGION_SPIRITUAL_ID ||
            userB.religion_id === RELIGION_SPIRITUAL_ID) {
            score += 4; // Spiritual person is flexible
        }
    }

    // Family oriented — exact match (max 8)
    if (userA.family_oriented && userB.family_oriented) {
        if (userA.family_oriented === userB.family_oriented) score += 8;
    }

    // Political alignment — ordinal with apolitical exception (max 7)
    if (userA.political && userB.political) {
        const a = userA.political;
        const b = userB.political;
        if (a === POLITICAL_APOLITICAL_ID || b === POLITICAL_APOLITICAL_ID) {
            score += 3; // Apolitical person is neutral — partial credit
        } else {
            const diff = Math.abs(a - b);
            if (diff === 0) score += 7;
            else if (diff === 1) score += 4;
            else if (diff === 2) score += 1;
            // diff >= 3 = incompatible ends of spectrum, 0 pts
        }
    }

    return Math.min(25, score);
}

// ─── TRUST BONUS (10 pts) ──────────────────────────────────────────────────
// internal_score from trust_score table (0–100) → scaled to 0–10
// null score defaults to 5 (neutral — new user assumed trustworthy)
function scoreTrust(candidate) {
    if (candidate.trust_score === null || candidate.trust_score === undefined) return 5;
    return Math.round((candidate.trust_score / 100) * 10);
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
// Returns totalScore (0–100) and full breakdown for transparency
module.exports = function scoreMatch(userA, userB) {
    const lifestyle   = scoreLifestyle(userA, userB);
    const interests   = scoreInterests(userA, userB);
    const personality = scorePersonality(userA, userB);
    const values      = scoreValues(userA, userB);
    const trust       = scoreTrust(userB);

    const totalScore = lifestyle + interests + personality + values + trust;

    return {
        totalScore,
        breakdown: { lifestyle, interests, personality, values, trust }
    };
};