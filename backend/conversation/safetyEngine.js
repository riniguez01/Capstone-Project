// safetyEngine.js
// Feature 3: Adaptive Conversation Safety & Consent Engine — Core Decision Engine
//
// Pipeline (spec §8):
//   1. Cooldown check           — sender blocked from a previous violation?
//   2. Message classification   — what category/risk is this message?
//   3. Escalation level         — how many unanswered/resistance signals?
//   4. Hard block check         — explicit, coercive, or restrict escalation
//   5. State + transition check — is this category allowed in current state?
//   6. Decision output          — deliver | prompt | block
//   7. State/counter update     — update conversation record
//
// All decisions are made BEFORE the message is saved or sent to the recipient.

const {
    STATE,
    getConversation,
    saveConversation,
    isOnCooldown,
    applyCooldown
} = require('./conversationState');

const { classifyMessage, requiredStateForCategory } = require('./riskClassifier');

// ─── Escalation level computation ─────────────────────────────────────────
// Spec §6 escalation table:
//   Normal  — no counters active
//   Warning — unansweredCount ≥ 2 OR repeatRequestCount ≥ 1
//   Restrict — resistanceCount > 0 OR repeated pressure (repeatRequestCount ≥ 3)
function getEscalationLevel(conv) {
    if (conv.resistanceCount > 0 || conv.repeatRequestCount >= 3) return 'restrict';
    if (conv.unansweredCount >= 2 || conv.repeatRequestCount >= 1) return 'warning';
    return 'normal';
}

// ─── State transition validator ────────────────────────────────────────────
// Checks whether moving from current state to required state is valid.
// Spec §5 transition rules.
function canTransitionTo(requiredState, conv) {
    if (requiredState <= conv.state) return true; // already at or past required state

    // Only adjacent transitions are valid — no skipping states
    if (requiredState > conv.state + 1) return false;

    // Entry conditions per target state
    if (requiredState === STATE.FLIRTING) {
        // S0 → S1: both users must have initiated at least once
        return conv.initiators.size >= 2 &&
            conv.resistanceWindow.filter(Boolean).length === 0;
    }

    if (requiredState === STATE.PERSONAL) {
        // S1 → S2: at least 3 alternating exchanges, no unresolved resistance
        return conv.alternatingCount >= 3 &&
            conv.resistanceWindow.filter(Boolean).length === 0;
    }

    if (requiredState === STATE.INTIMATE) {
        // S2 → S3: consent proxy ≥ 0.6, no resistance in last 5, no escalation flags
        return conv.consentScore >= 0.6 &&
            conv.resistanceWindow.filter(Boolean).length === 0 &&
            conv.resistanceCount === 0;
    }

    return false;
}

// ─── Consent proxy score updater ──────────────────────────────────────────
// Spec §7 — soft numerical estimate of mutual engagement.
// Adjusts up for healthy patterns, down for one-sided or resistant patterns.
function updateConsentScore(conv, isAlternating) {
    let delta = 0;

    if (isAlternating) delta += 0.05;                        // good: they replied
    if (conv.unansweredCount >= 2) delta -= 0.05;            // bad: one-sided
    if (conv.resistanceCount > 0) delta -= 0.10;             // bad: resistance detected
    if (conv.consentScore > 0.7 && isAlternating) delta += 0.02; // bonus: sustained engagement

    return Math.max(0, Math.min(1, conv.consentScore + delta));
}

// ─── MAIN EVALUATION FUNCTION ──────────────────────────────────────────────
// Called by socketServer BEFORE saving or sending a message.
//
// Returns:
// {
//   decision:  'deliver' | 'prompt' | 'block',
//   reason:    string | null,         — shown to sender on block/prompt
//   category:  string,                — for logging
//   escalation: string,               — 'normal' | 'warning' | 'restrict'
//   cooldownApplied: boolean
// }
function evaluateMessage(matchId, senderId, recipientId, content) {
    const conv = getConversation(matchId);

    // ── Step 1: Cooldown check ─────────────────────────────────────────────
    if (isOnCooldown(matchId, senderId)) {
        return {
            decision:       'block',
            reason:         'You are currently in a cooldown period. Please wait before sending another message.',
            category:       'cooldown',
            escalation:     'restrict',
            cooldownApplied: false
        };
    }

    // ── Step 2: Classify the message ──────────────────────────────────────
    const { category, riskLevel } = classifyMessage(content);
    const requiredState           = requiredStateForCategory(category);

    // ── Step 3: Compute escalation BEFORE updating counters ───────────────
    const escalation = getEscalationLevel(conv);

    // ── Step 4: Hard blocks — explicit/coercive always blocked ────────────
    if (riskLevel === 2) {
        // Apply cooldown for coercive/explicit — spec "Temporary sending restriction"
        applyCooldown(matchId, senderId, 2);
        _updateCounters(conv, senderId, recipientId, category, false);
        saveConversation(matchId, conv);
        return {
            decision:       'block',
            reason:         category === 'explicit'
                ? 'This type of content is not allowed on Aura.'
                : 'Coercive language is not permitted. Your message was not sent.',
            category,
            escalation,
            cooldownApplied: true
        };
    }

    // Hard block if escalation is restrict (resistance or repeated pressure)
    if (escalation === 'restrict') {
        applyCooldown(matchId, senderId, 2);
        _updateCounters(conv, senderId, recipientId, category, false);
        saveConversation(matchId, conv);
        return {
            decision:       'block',
            reason:         'A boundary has been indicated in this conversation. Your message was not sent.',
            category,
            escalation,
            cooldownApplied: true
        };
    }

    // ── Step 5: State + transition check ──────────────────────────────────
    if (requiredState > conv.state) {
        if (!canTransitionTo(requiredState, conv)) {
            // Invalid transition — block
            _updateCounters(conv, senderId, recipientId, category, false);
            saveConversation(matchId, conv);
            return {
                decision:       'block',
                reason:         _transitionBlockReason(conv.state, requiredState),
                category,
                escalation,
                cooldownApplied: false
            };
        }
        // Valid transition — advance state
        conv.state = requiredState;
    }

    // ── Step 6: Warning escalation — prompt but allow ─────────────────────
    if (escalation === 'warning' || riskLevel === 1) {
        _updateCounters(conv, senderId, recipientId, category, true);
        saveConversation(matchId, conv);
        return {
            decision:       'prompt',
            reason:         'Just a reminder to make sure the other person is comfortable.',
            category,
            escalation,
            cooldownApplied: false
        };
    }

    // ── Step 7: All good — deliver ─────────────────────────────────────────
    _updateCounters(conv, senderId, recipientId, category, true);
    saveConversation(matchId, conv);
    return {
        decision:       'deliver',
        reason:         null,
        category,
        escalation,
        cooldownApplied: false
    };
}

// ─── Internal counter update helper ───────────────────────────────────────
// Updates all behavioral counters and consent score.
// Called AFTER the decision is already made (doesn't affect current decision).
function _updateCounters(conv, senderId, recipientId, category, willDeliver) {
    const isAlternating = conv.lastSenderId !== null && conv.lastSenderId !== senderId;

    // Track initiators (both users must have sent at least one message)
    if (!conv.messageCounts[senderId]) {
        conv.initiators.add(senderId);
    }
    conv.messageCounts[senderId] = (conv.messageCounts[senderId] || 0) + 1;
    conv.totalMessages++;

    // Unanswered count — resets when the other person replies
    if (conv.lastSenderId === senderId) {
        conv.unansweredCount++;
    } else {
        conv.unansweredCount = 0;
        if (isAlternating) conv.alternatingCount++;
    }

    // Repeat request count
    if (category === 'pressure') {
        conv.repeatRequestCount++;
    }

    // Resistance tracking — refusal from recipient updates resistance window
    // We detect refusals in the RECIPIENT's messages (when they send back a refusal)
    const isRefusal = category === 'refusal';
    conv.resistanceWindow = [...conv.resistanceWindow.slice(-4), isRefusal];
    if (isRefusal) conv.resistanceCount++;

    // Update consent score
    conv.consentScore = updateConsentScore(conv, isAlternating);

    // Try advancing state naturally (organic progression for normal messages)
    if (category === 'normal' || category === 'flirty') {
        _tryNaturalStateAdvance(conv);
    }

    // Update last sender
    conv.lastSenderId = senderId;
}

// ─── Attempt natural state progression ────────────────────────────────────
function _tryNaturalStateAdvance(conv) {
    if (conv.state === STATE.INTRODUCTORY &&
        conv.initiators.size >= 2 &&
        conv.resistanceWindow.filter(Boolean).length === 0) {
        conv.state = STATE.FLIRTING;
    }
}

// ─── Human-readable block reasons ─────────────────────────────────────────
function _transitionBlockReason(currentState, requiredState) {
    if (currentState === STATE.INTRODUCTORY && requiredState >= STATE.INTIMATE) {
        return 'This type of message is only appropriate later in a conversation. Take time to get to know each other first.';
    }
    if (requiredState === STATE.INTIMATE) {
        return 'Intimate topics require sustained mutual engagement first. Keep getting to know each other.';
    }
    if (requiredState === STATE.FLIRTING) {
        return 'Wait for the other person to engage before moving in that direction.';
    }
    return 'This message isn\'t appropriate at this stage of the conversation.';
}

module.exports = { evaluateMessage };