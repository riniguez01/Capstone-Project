// routes/match.js
const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const { protect } = require("../middleware/authMiddleware");

router.get("/all",             matchController.getAllCandidates);
router.get("/:userId",         protect, matchController.getMatches);
router.post("/:userId/like",   protect, matchController.likeUser);

module.exports = router;