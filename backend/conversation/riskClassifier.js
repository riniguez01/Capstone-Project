// riskClassifier.js
// Deterministic, rule-based message risk classification.
// No machine learning — fully auditable and explainable.
//
// Returns: { category, riskLevel }
//   category:  internal codes (normal | flirty | intimate | explicit | pressure | coercive | refusal)
//   riskLevel: 0 = safe | 1 = warn sender | 2 = block immediately
//
// Categories map to required conversation states:
//   normal    → STATE 0 (always allowed)
//   flirty    → STATE 1 (requires mutual initiation)
//   intimate  → STATE 3 (requires consent proxy ≥ 0.6, no resistance)
//   explicit  → always blocked (never delivered) — severe inappropriate request (school-safe demo patterns)
//   pressure  → riskLevel 1 (warn)
//   coercive  → always blocked — threats / strong pressure
//   refusal   → riskLevel 0 but triggers resistance tracking

// ─── Pattern definitions (classroom-appropriate wording; no graphic terms) ───

// Blocked immediately (risk 2): severe inappropriate or unsafe requests
const EXPLICIT_PATTERNS = [
    /\b(send (me )?inappropriate (photos?|pics?|pictures))\b/i,
    /\b(keep (this|us|it) (secret|private) from (your )?(parents|mom|dad|guardians?|teachers?))\b/i,
    /\b(meet (me )?alone (when|where) no (adults|teachers|parents) (are )?(around|there))\b/i,
    /\b(let'?s (do )?something (no one|nobody) should know about)\b/i,
];

const COERCIVE_PATTERNS = [
    /\b(if you (don'?t|won'?t|refuse|ignore))\b/i,
    /\b(or else|you have to|you need to|you must|i demand)\b/i,
    /\b(you owe me)\b/i,
    /\b(stop being (so |such )?(difficult|boring|rude|unreasonable))\b/i,
];

// WARN — pressure signals (riskLevel 1)
const PRESSURE_PATTERNS = [
    /\b(why (won'?t|don'?t|aren'?t) you (reply|respond|answer|talk))\b/i,
    /\b(stop ignoring (me|my messages?))\b/i,
    /\b(answer me|respond to me|reply to me)\b/i,
    /\bhelloo+\b/i,
    /\byou there\??/i,
    /\bare you (even )?alive\b/i,
    /\bwhy do you keep ignoring\b/i,
    /\bcome on,? (just|please)\b/i,
];

// TRACK resistance — not a block, but increments resistanceCount
const REFUSAL_PATTERNS = [
    /\b(no thanks?|not interested|please stop|leave me alone)\b/i,
    /\b(don'?t (message|text|contact) me)\b/i,
    /\b(stop (texting|messaging|contacting) me)\b/i,
    /\b(i('?m| am) not comfortable)\b/i,
    /\b(i said no)\b/i,
    /\b(back off|go away)\b/i,
];

// INTIMATE — requires STATE 3
const INTIMATE_PATTERNS = [
    /\b(i (love|miss|need|want) you)\b/i,
    /\b(can'?t stop thinking about you)\b/i,
    /\b(let'?s (meet|hang out|get together|go on a date))\b/i,
    /\b(wanna meet( up)?)\b/i,
    /\b(i('?ve| have) feelings for you)\b/i,
];

// FLIRTY — requires STATE 1
const FLIRTY_PATTERNS = [
    /\b(you('?re| are) (so )?(cute|sweet|gorgeous|beautiful|handsome|attractive))\b/i,
    /\b(i like you)\b/i,
    /\b(i('?m| am) (really )?into you)\b/i,
    /\b(have a crush)\b/i,
];

// ─── Classifier ────────────────────────────────────────────────────────────
function classifyMessage(text) {
    if (!text || typeof text !== 'string') {
        return { category: 'normal', riskLevel: 0 };
    }

    const t = text.trim();

    // Check in order of severity — most severe first
    for (const p of COERCIVE_PATTERNS) {
        if (p.test(t)) return { category: 'coercive', riskLevel: 2 };
    }
    for (const p of EXPLICIT_PATTERNS) {
        if (p.test(t)) return { category: 'explicit', riskLevel: 2 };
    }
    for (const p of REFUSAL_PATTERNS) {
        if (p.test(t)) return { category: 'refusal', riskLevel: 0 };
    }
    for (const p of PRESSURE_PATTERNS) {
        if (p.test(t)) return { category: 'pressure', riskLevel: 1 };
    }
    for (const p of INTIMATE_PATTERNS) {
        if (p.test(t)) return { category: 'intimate', riskLevel: 0 };
    }
    for (const p of FLIRTY_PATTERNS) {
        if (p.test(t)) return { category: 'flirty', riskLevel: 0 };
    }

    return { category: 'normal', riskLevel: 0 };
}

// ─── Map category to minimum required conversation state ──────────────────
const STATE = { INTRODUCTORY: 0, FLIRTING: 1, PERSONAL: 2, INTIMATE: 3 };

function requiredStateForCategory(category) {
    switch (category) {
        case 'flirty':   return STATE.FLIRTING;
        case 'intimate': return STATE.INTIMATE;
        case 'explicit': return STATE.INTIMATE + 1; // always too high — blocks regardless
        case 'coercive': return STATE.INTIMATE + 1; // always too high — blocks regardless
        default:         return STATE.INTRODUCTORY;  // normal, pressure, refusal
    }
}

// Heuristic: likely a request or repeated question (spec §6 repeat requests / questions)
const REQUEST_QUESTION_HINTS = [
    /\?/,
    /\b(will you|can you|could you|would you|do you mind)\b/i,
    /\b(when (can|will|are) you|what about|how about)\b/i,
    /\b(please (answer|reply|respond)|did you get)\b/i,
    /\b(what do you think|let me know)\b/i,
];

function looksLikeRequestOrQuestion(text) {
    if (!text || typeof text !== "string") return false;
    const t = text.trim();
    if (t.length < 3) return false;
    return REQUEST_QUESTION_HINTS.some((p) => p.test(t));
}

/** Short normalized stem to detect the same ask again without a reply from the peer */
function normalizeRequestStem(text) {
    if (!text || typeof text !== "string") return "";
    return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s?]/g, "")
        .trim()
        .slice(0, 96);
}

module.exports = {
    classifyMessage,
    requiredStateForCategory,
    looksLikeRequestOrQuestion,
    normalizeRequestStem,
};