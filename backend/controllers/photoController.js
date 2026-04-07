const pool = require("../config/db");

exports.uploadMiddleware = (req, res, next) => next();

exports.uploadPhoto = async (req, res) => {
    const user_id = req.user?.id;
    if (!user_id) return res.status(400).json({ error: "Not authenticated." });

    const { photo_url } = req.body;
    if (!photo_url) return res.status(400).json({ error: "photo_url is required." });

    try {
        await pool.query(
            "UPDATE users SET profile_photo_url = $1 WHERE user_id = $2",
            [photo_url, user_id]
        );
        res.json({ message: "Photo updated.", photo_url });
    } catch (err) {
        console.error("uploadPhoto error:", err.message);
        res.status(500).json({ error: "Failed to update photo." });
    }
};