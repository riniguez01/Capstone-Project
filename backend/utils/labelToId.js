// labelToId.js
// Converts frontend string labels to database integer IDs.
// IDs verified directly from live Railway DB — checkSeeds.js output.

// ── religion_type ──────────────────────────────────────────────────────────
const RELIGION = {
    "No preference":            1,
    "Atheist":                  2,
    "Agnostic":                 3,
    "Buddhist":                 4,
    "Catholic":                 5,
    "Christian":                6,
    "Hindu":                    7,
    "Jewish":                   8,
    "Mormon":                   9,
    "Muslim":                   10,
    "Spiritual (non-religious)": 11,
    "Other":                    12,
    "Prefer not to say":        13,
};

// ── want_children ──────────────────────────────────────────────────────────
const CHILDREN = {
    "No preference":  1,
    "Want kids":      2,
    "Have kids":      3,
    "Don't want kids": 4,
    "Open":           5,
};

// ── political_affil ────────────────────────────────────────────────────────
const POLITICAL = {
    "No preference":     1,
    "Very Liberal":      2,
    "Liberal":           3,
    "Moderate":          4,
    "Conservative":      5,
    "Very Conservative": 6,
    "Apolitical":        7,
    "Prefer not to say": 8,
};

// ── dating_goals ───────────────────────────────────────────────────────────
const DATING_GOALS = {
    "No preference": 1,
    "Casual":        2,
    "Serious":       3,
    "Long-term":     4,
};

// ── activity_level ─────────────────────────────────────────────────────────
const ACTIVITY_LEVEL = {
    "No preference": 1,
    "Low":           2,
    "Medium":        3,
    "High":          4,
};

// ── smoking ────────────────────────────────────────────────────────────────
const SMOKING = {
    "Yes":          1,
    "No":           2,
    "Occasionally": 3,
};

// ── drinking ───────────────────────────────────────────────────────────────
const DRINKING = {
    "Yes":    1,
    "No":     2,
    "Social": 3,
};

// ── coffee_drinker ─────────────────────────────────────────────────────────
const COFFEE = {
    "Yes": 1,
    "No":  2,
};

// ── diet ───────────────────────────────────────────────────────────────────
const DIET = {
    "Omnivore":   1,
    "Vegetarian": 2,
    "Vegan":      3,
    "Other":      4,
};

// ── music ──────────────────────────────────────────────────────────────────
const MUSIC = {
    "Pop":              1,
    "Hip-Hop / Rap":    2,
    "R&B / Soul":       3,
    "Rock":             4,
    "Country":          5,
    "Electronic / EDM": 6,
    "Jazz / Blues":     7,
    "Classical":        8,
    "Latin":            9,
    "Everything":       10,
    "Other":            11,
};

// ── gamer ──────────────────────────────────────────────────────────────────
const GAMER = {
    "Yes":    1,
    "No":     2,
    "Casual": 3,
};

// ── reader ─────────────────────────────────────────────────────────────────
const READER = {
    "Yes":          1,
    "No":           2,
    "Occasionally": 3,
};

// ── travel_interest ────────────────────────────────────────────────────────
const TRAVEL = {
    "Love it":      1,
    "Occasionally": 2,
    "Not really":   3,
};

// ── pet_interest ───────────────────────────────────────────────────────────
const PET_INTEREST = {
    "Love animals": 1,
    "Have pets":    2,
    "Allergic":     3,
    "Not a fan":    4,
    "Neutral":      5,
};

// ── personality_type ───────────────────────────────────────────────────────
const PERSONALITY = {
    "Introvert": 1,
    "Extrovert": 2,
    "Ambivert":  3,
};

// ── family_oriented ────────────────────────────────────────────────────────
const FAMILY_ORIENTED = {
    "No preference": 1,
    "Yes":           2,
    "No":            3,
};

// ── gender_type ────────────────────────────────────────────────────────────
const GENDER = {
    "Open to all":       1,
    "Male":              2,
    "Man":               2,
    "Female":            3,
    "Woman":             3,
    "Non-binary":        4,
    "Other":             5,
    "Prefer not to say": 6,
};

// ── ethnicity_type ─────────────────────────────────────────────────────────
const ETHNICITY = {
    "No preference":          1,
    "Asian":                  2,
    "Black / African American": 3,
    "Hispanic / Latino":      4,
    "Middle Eastern":         5,
    "Native American":        6,
    "Pacific Islander":       7,
    "White / Caucasian":      8,
    "Multiracial":            9,
    "Other":                  10,
    "Prefer not to say":      11,
};

// ── education_career ───────────────────────────────────────────────────────
const EDUCATION = {
    "No preference":      1,
    "High School":        2,
    "Some College":       3,
    "Associate's Degree": 4,
    "Bachelor's Degree":  5,
    "Master's Degree":    6,
    "Doctorate / PhD":    7,
    "Trade / Vocational": 8,
    "Trade":              8,  // frontend uses "Trade", DB has "Trade / Vocational"
    "Other":              9,
};

// ── astrology_sign ─────────────────────────────────────────────────────────
const ASTROLOGY = {
    "Aries":       1,
    "Taurus":      2,
    "Gemini":      3,
    "Cancer":      4,
    "Leo":         5,
    "Virgo":       6,
    "Libra":       7,
    "Scorpio":     8,
    "Sagittarius": 9,
    "Capricorn":   10,
    "Aquarius":    11,
    "Pisces":      12,
};

// ── helper ─────────────────────────────────────────────────────────────────
function toId(map, label) {
    if (!label || label === "") return null;
    const result = map[label];
    return result !== undefined ? result : null;
}

module.exports = {
    toId,
    RELIGION, CHILDREN, POLITICAL, DATING_GOALS, ACTIVITY_LEVEL,
    SMOKING, DRINKING, COFFEE, DIET, MUSIC, GAMER, READER,
    TRAVEL, PET_INTEREST, PERSONALITY, FAMILY_ORIENTED,
    GENDER, ETHNICITY, EDUCATION, ASTROLOGY,
};