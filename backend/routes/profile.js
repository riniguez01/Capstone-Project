const express           = require("express");
const router            = express.Router();
const profileController = require("../controllers/profileController");
const photoController   = require("../controllers/photoController");
const { protect }       = require("../middleware/authMiddleware");

router.post("/save",        protect, profileController.saveProfile);
router.post("/preferences", protect, profileController.savePreferences);
router.get("/preferences",  protect, profileController.getPreferences);
router.post("/photo",       protect, photoController.uploadMiddleware, photoController.uploadPhoto);

module.exports = router;