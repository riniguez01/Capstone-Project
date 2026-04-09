function updateConsentScore(conv, isAlternating) {
    let delta = 0;
    if (isAlternating) delta += 0.05;
    if (conv.unansweredCount >= 2) delta -= 0.05;
    if (conv.resistanceCount > 0) delta -= 0.10;
    if (conv.consentScore > 0.7 && isAlternating) delta += 0.02;
    return Math.max(0, Math.min(1, conv.consentScore + delta));
}
module.exports = { updateConsentScore };