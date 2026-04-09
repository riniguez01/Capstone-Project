// riskClassifier.js
// Deterministic, rule-based message risk classification.
// No machine learning — fully auditable and explainable.
//
// Returns: { category, riskLevel }
//   category:  'normal' | 'flirty' | 'intimate' | 'explicit' | 'pressure' | 'coercive' | 'refusal'
//   riskLevel: 0 = safe | 1 = warn sender | 2 = block immediately
//
// Categories map to required conversation states:
//   normal    → STATE 0 (always allowed)
//   flirty    → STATE 1 (requires mutual initiation)
//   intimate  → STATE 3 (requires consent proxy ≥ 0.6, no resistance)
//   explicit  → always blocked (never delivered)
//   pressure  → riskLevel 1 (warn)
//   coercive  → always blocked
//   refusal   → riskLevel 0 but triggers resistance tracking

// ─── Pattern definitions ───────────────────────────────────────────────────

// BLOCK immediately — explicit sexual content or coercion
const EXPLICIT_PATTERNS = [
    /\b(send (me )?(nudes?|pics?|photos?|a pic))\b/i,
    /\bwanna (f|hook ?up|smash|bang)\b/i,
    /\b(want to|wanna|let'?s) hook ?up\b/i,
    /\b(DTF|down to f[a-z]*)\b/i,
    /\b(sex|sexual|naked|nude)\b/i,
    /\b(come over|come to my (place|apartment|house|hotel))\b/i,
    /\b(netflix and chill)\b/i,
    /\b(sleep with (me|you))\b/i,
];

const COERCIVE_PATTERNS = [
    /\b(if you (don'?t|won'?t|refuse|ignore))\b/i,
    /\b(or else|you have to|you need to|you must|i demand)\b/i,
    /\b(you owe me)\b/i,
    /\b(stop being (so |such )?(difficult|stuck up|prude|boring))\b/i,
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
    /\b(you('?re| are) (so )?(cute|hot|gorgeous|beautiful|handsome|attractive))\b/i,
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

module.exports = { classifyMessage, requiredStateForCategory };