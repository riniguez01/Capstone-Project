const { STATE } = require("./conversationState");
function detectCurrentState(conv) { return conv.state; }
function getStateName(state) {
    return ["Introductory","Flirting","Personal","Intimate"][state] || "Unknown";
}
module.exports = { detectCurrentState, getStateName };