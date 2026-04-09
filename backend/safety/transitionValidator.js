const { STATE } = require("./conversationState");
function canTransitionTo(requiredState, conv) {
    if (requiredState <= conv.state) return true;
    if (requiredState > conv.state + 1) return false;
    if (requiredState === STATE.FLIRTING)
        return conv.initiators.size >= 2 && conv.resistanceWindow.filter(Boolean).length === 0;
    if (requiredState === STATE.PERSONAL)
        return conv.alternatingCount >= 3 && conv.resistanceWindow.filter(Boolean).length === 0;
    if (requiredState === STATE.INTIMATE)
        return conv.consentScore >= 0.6 && conv.resistanceWindow.filter(Boolean).length === 0 && conv.resistanceCount === 0;
    return false;
}
module.exports = { canTransitionTo };