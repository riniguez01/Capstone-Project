// safety/classifier.js
// Classifies message content into a state level (0–3)
// and detects resistance signals.
// Rule-based only — no ML needed.

const S3_KEYWORDS = [
    'send me a pic', 'send nudes', 'what are you wearing', 'come over',
    'come to my place', 'hook up', 'netflix and chill',
    'friends with benefits', 'fwb', 'sleep with', 'have sex',
    'get intimate', 'in bed', 'naked', 'nudes', 'sexy pic', 'body pic'
];

const S2_KEYWORDS = [
    'my ex', 'past relationship', 'i really like you', 'i miss you',
    'you mean a lot', 'i have feelings', 'emotionally', 'vulnerable',
    'open up', 'trust you', 'personal story'
];

const S1_KEYWORDS = [
    "you're cute", "you're hot", "you're attractive", 'i like you',
    "you're funny", 'crush', 'date sometime', 'ask you out', 'flirt'
];

const RESISTANCE_KEYWORDS = [
    'stop', "don't", 'leave me alone', 'not interested', 'please stop',
    'back off', 'no thanks', 'i said no', 'uncomfortable', "that's too much",
    'slow down', 'not ready', "don't want to", "please don't"
];

module.exports = function classifyMessage(content) {
    const lower = content.toLowerCase();

    const isResistance = RESISTANCE_KEYWORDS.some(kw => lower.includes(kw));

    let messageLevel = 0;
    if (S3_KEYWORDS.some(kw => lower.includes(kw)))      messageLevel = 3;
    else if (S2_KEYWORDS.some(kw => lower.includes(kw))) messageLevel = 2;
    else if (S1_KEYWORDS.some(kw => lower.includes(kw))) messageLevel = 1;

    return { messageLevel, isResistance };
};