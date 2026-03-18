// scoreMatch.js
// Stage 2 of the matching pipeline — weighted compatibility scoring.
// Evaluates 5 dimensions + trust bonus using integer IDs from the real DB schema.
// Returns a totalScore (0–100) and a per-dimension breakdown.
//
// ─── SEED DATA ALIGNMENT ──────────────────────────────────────────────────
// ID mappings below must match Beka's seed insert order.
// Update these constants once Beka confirms — do NOT guess.
//
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

// ⚠️  Set SEED_CONFIRMED = true once Beka confirms all seed orders above.
//     While false, any dimension that relies on specific IDs will return 0
//     instead of a wrong score — better to score nothing than score wrong.
const SEED_CONFIRMED = false;

const POLITICAL_APOLITICAL_ID = 6;
const RELIGION_SPIRITUAL_ID   = 10;
const AMBIVERT_ID             = 3;

// ─── LIFESTYLE DIMENSION (25 pts) ──────────────────────────────────────────
function scoreLifestyle(userA, userB) {
    if (!SEED_CONFIRMED) return 0;
    let score = 0;

    if (userA.activity_level && userB.activity_level) {
        const diff = Math.abs(userA.activity_level - userB.activity_level);
        if (diff === 0) score += 10;
        else if (diff === 1) score += 5;
    }
    if (userA.drinking_id && userB.drinking_id) {
        if (userA.drinking_id === userB.drinking_id) score += 6;
        else if (Math.abs(userA.drinking_id - userB.drinking_id) === 1) score += 3;
    }
    if (userA.smoking_id && userB.smoking_id) {
        if (userA.smoking_id === userB.smoking_id) score += 4;
        else if (userA.smoking_id === 3 || userB.smoking_id === 3) score += 1;
    }
    if (userA.diet_id && userB.diet_id) {
        if (userA.diet_id === userB.diet_id) score += 3;
    }
    if (userA.coffee_id && userB.coffee_id) {
        if (userA.coffee_id === userB.coffee_id) score += 2;
    }

    return Math.min(25, score);
}

// ─── INTERESTS DIMENSION (25 pts) ──────────────────────────────────────────
// Music and pet_interest are exact-match only — safe regardless of seed order
// Travel and gamer use ordinal distance — only safe after seed confirmed
function scoreInterests(userA, userB) {
    let score = 0;

    // Music — exact match only, safe before seed confirmation
    if (userA.music && userB.music) {
        if (userA.music === userB.music) score += 8;
    }

    // Pet interest — exact match only, safe before seed confirmation
    if (userA.pet_interest && userB.pet_interest) {
        if (userA.pet_interest === userB.pet_interest) score += 3;
    }

    // Reader — exact match only
    if (userA.reader && userB.reader) {
        if (userA.reader === userB.reader) score += 3;
    }

    if (SEED_CONFIRMED) {
        // Travel uses ordinal distance — needs confirmed seed order
        if (userA.travel && userB.travel) {
            if (userA.travel === userB.travel) score += 7;
            else if (Math.abs(userA.travel - userB.travel) === 1) score += 3;
        }
        // Gamer partial credit for casual
        if (userA.gamer && userB.gamer) {
            if (userA.gamer === userB.gamer) score += 4;
            else if (userA.gamer === 3 || userB.gamer === 3) score += 2;
        }
    } else {
        // Safe fallbacks — exact match only until confirmed
        if (userA.travel && userB.travel && userA.travel === userB.travel) score += 7;
        if (userA.gamer && userB.gamer && userA.gamer === userB.gamer) score += 4;
    }

    return Math.min(25, score);
}

// ─── PERSONALITY DIMENSION (15 pts) ────────────────────────────────────────
// Safe without seed confirmation — uses exact match + ambivert special case
function scorePersonality(userA, userB) {
    if (!userA.personality_type || !userB.personality_type) return 0;
    if (userA.personality_type === AMBIVERT_ID || userB.personality_type === AMBIVERT_ID) return 12;
    if (userA.personality_type === userB.personality_type) return 15;
    return 6; // Introvert + Extrovert
}

// ─── VALUES DIMENSION (25 pts) ─────────────────────────────────────────────
function scoreValues(userA, userB) {
    let score = 0;

    // Religion — exact match safe, spiritual partial needs confirmed ID
    if (userA.religion_id && userB.religion_id) {
        if (userA.religion_id === userB.religion_id) {
            score += 10;
        } else if (SEED_CONFIRMED &&
            (userA.religion_id === RELIGION_SPIRITUAL_ID ||
                userB.religion_id === RELIGION_SPIRITUAL_ID)) {
            score += 4;
        }
    }

    // Family oriented — exact match only, safe
    if (userA.family_oriented && userB.family_oriented) {
        if (userA.family_oriented === userB.family_oriented) score += 8;
    }

    // Political — ordinal distance needs confirmed seed order
    if (userA.political && userB.political) {
        if (SEED_CONFIRMED) {
            const a = userA.political;
            const b = userB.political;
            if (a === POLITICAL_APOLITICAL_ID || b === POLITICAL_APOLITICAL_ID) {
                score += 3;
            } else {
                const diff = Math.abs(a - b);
                if (diff === 0) score += 7;
                else if (diff === 1) score += 4;
                else if (diff === 2) score += 1;
            }
        } else {
            // Safe fallback — exact match only
            if (userA.political === userB.political) score += 7;
        }
    }

    return Math.min(25, score);
}

// ─── TRUST BONUS (10 pts) ──────────────────────────────────────────────────
function scoreTrust(candidate) {
    if (candidate.trust_score === null || candidate.trust_score === undefined) return 5;
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
        breakdown: { lifestyle, interests, personality, values, trust }
    };
};