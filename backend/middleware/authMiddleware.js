// middleware/authMiddleware.js
const { verifyToken } = require("../utils/jwtHelper");

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided. Unauthorized." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token); // { id: userId }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = { protect };