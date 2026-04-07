
const express = require("express");
const router = express.Router();
const {submitCheckin, getCheckinHistory} = require("../controllers/checkinController");


router.post("/submit", submitCheckin);


router.get("/history/:user_id", getCheckinHistory);

module.exports = router;