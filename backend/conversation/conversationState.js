// conversationState.js
// Manages per-conversation state in memory.
// Each entry tracks the 4-state model, consent proxy score,
// and behavioral counters defined in the Feature 3 spec.
//
// State model:
//   0 = Introductory   — greetings, small talk
//   1 = Flirting       — light romantic, playful
//   2 = Personal       — feelings, personal disclosures
//   3 = Intimate       — meeting proposals, sensitive topics
//
// In production this would be backed by Redis for persistence across restarts.
// For the capstone demo, in-memory is sufficient.

const STATE = {
    INTRODUCTORY: 0,
    FLIRTING:     1,
    PERSONAL:     2,
    INTIMATE:     3
};

// matchId (integer) → ConversationRecord
const store = new Map();

// ─── Get or initialize a conversation record ──────────────────────────────
function getConversation(matchId) {
    if (!store.has(matchId)) {
        store.set(matchId, {
            matchId,

            // Current state (0–3)
            state: STATE.INTRODUCTORY,

            // Consent proxy score — soft estimate of mutual engagement
            // Spec: initialized at 0.50
            consentScore: 0.50,

            // Per-user message counts — tracks who has sent how many
            // { userId: count }
            messageCounts: {},

            // Set of userIds who have initiated at least once
            // When size >= 2, both users have participated
            initiators: new Set(),

            // Total alternating exchanges (A→B, B→A counts as 1 exchange)
            alternatingCount: 0,

            // Last sender — used to detect one-sided messaging
            lastSenderId: null,

            // Behavioral counters (spec §6)
            unansweredCount:    0,  // consecutive messages from same sender
            repeatRequestCount: 0,  // repeated similar requests
            resistanceCount:    0,  // cumulative detected refusals/avoidance

            // Sliding window — boolean flags for last 5 messages
            // true = that message contained a resistance/refusal signal
            resistanceWindow: [],

            // Cooldown — timestamp until which sender is restricted
            // null = no cooldown active
            cooldownUntil: null,

            // Total messages processed in this conversation
            totalMessages: 0
        });
    }
    return store.get(matchId);
}

// ─── Persist updates back to the store ────────────────────────────────────
function saveConversation(matchId, updates) {
    const current = getConversation(matchId);
    store.set(matchId, { ...current, ...updates });
}

// ─── Check if a sender is currently under cooldown ────────────────────────
function isOnCooldown(matchId, senderId) {
    const conv = getConversation(matchId);
    if (!conv.cooldownUntil) return false;
    if (conv.cooldownSenderId !== senderId) return false;
    return new Date() < new Date(conv.cooldownUntil);
}

// ─── Apply a cooldown to a sender (2 minutes for demo; spec says "period") ─
function applyCooldown(matchId, senderId, minutes = 2) {
    const until = new Date(Date.now() + minutes * 60 * 1000);
    const conv  = getConversation(matchId);
    saveConversation(matchId, {
        ...conv,
        cooldownUntil:    until.toISOString(),
        cooldownSenderId: senderId
    });
}

// ─── Reset cooldown ────────────────────────────────────────────────────────
function clearCooldown(matchId) {
    const conv = getConversation(matchId);
    saveConversation(matchId, { ...conv, cooldownUntil: null, cooldownSenderId: null });
}

module.exports = {
    STATE,
    getConversation,
    saveConversation,
    isOnCooldown,
    applyCooldown,
    clearCooldown
};