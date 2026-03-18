// routes/profile.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.post("/save",        profileController.saveProfile);
router.post("/preferences", profileController.savePreferences);

module.exports = router;