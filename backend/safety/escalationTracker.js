function getEscalationLevel(conv) {
    if (conv.resistanceCount > 0 || conv.repeatRequestCount >= 3) return "restrict";
    if (conv.unansweredCount >= 2 || conv.repeatRequestCount >= 1) return "warning";
    return "normal";
}
module.exports = { getEscalationLevel };