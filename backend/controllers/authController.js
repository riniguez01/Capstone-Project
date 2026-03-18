// authController.js
// Handles user signup and login.
// POST /auth/signup — creates a new user record
// POST /auth/login  — validates credentials and returns JWT
const pool        = require("../config/db");
const bcrypt      = require("bcrypt");
const { generateToken } = require("../utils/jwtHelper"); // ← ADDED
const SALT_ROUNDS = 10;

// ─── POST /auth/signup ─────────────────────────────────────────────────────
// Expects: { firstName, lastName, location, age, email, password }
// Alex's signup.jsx collects age (number) — we convert to an estimated DOB.
// Location is stored in location_city; location_state left null until we split it.
exports.signup = async (req, res) => {
    const { firstName, lastName, location, age, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !location || !age || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (age < 18) {
        return res.status(400).json({ error: "You must be 18 or older." });
    }
    if (!email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    try {
        // Check if email already exists
        const existing = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Convert age → estimated date of birth (Jan 1 of birth year)
        const birthYear     = new Date().getFullYear() - parseInt(age);
        const date_of_birth = `${birthYear}-01-01`;

        // Insert new user — default account_status = 'active', role_id = 1 (user), tier_id = 1 (free)
        const result = await pool.query(
            `INSERT INTO users
                (first_name, last_name, email, password_hash, date_of_birth, location_city, account_status, created_at, role_id, tier_id)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), 1, 1)
             RETURNING user_id, first_name, last_name, email`,
            [firstName, lastName, email, password_hash, date_of_birth, location]
        );
        const newUser = result.rows[0];

        // Create default trust score entry
        await pool.query(
            "INSERT INTO trust_score (user_id, internal_score, last_updated) VALUES ($1, 75, NOW())",
            [newUser.user_id]
        );

        // Generate JWT ← ADDED
        const token = generateToken(newUser.user_id);

        res.status(201).json({
            message: "Account created successfully.",
            token,          // ← ADDED
            user: newUser
        });
    } catch (err) {
        console.error("signup error:", err.message);
        res.status(500).json({ error: "Signup failed. Please try again." });
    }
};

// ─── POST /auth/login ──────────────────────────────────────────────────────
// Expects: { email, password }
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const result = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.account_status
             FROM users u
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = result.rows[0];

        if (user.account_status !== 'active') {
            return res.status(403).json({ error: "This account has been suspended or banned." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // Update last_login timestamp
        await pool.query(
            "UPDATE users SET last_login = NOW() WHERE user_id = $1",
            [user.user_id]
        );

        // Generate JWT ← ADDED
        const token = generateToken(user.user_id);

        res.json({
            message: "Login successful.",
            token,          // ← ADDED
            user: {
                user_id:    user.user_id,
                first_name: user.first_name,
                last_name:  user.last_name,
                email:      user.email
            }
        });
    } catch (err) {
        console.error("login error:", err.message);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
};

// ─── GET /auth/me ──────────────────────────────────────────────────────────
// Protected route — requires valid JWT via authMiddleware
// Returns the currently logged-in user's basic profile info
exports.getMe = async (req, res) => {                   // ← ADDED
    try {
        const result = await pool.query(
            `SELECT user_id, first_name, last_name, email, account_status
             FROM users WHERE user_id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error("getMe error:", err.message);
        res.status(500).json({ error: "Could not fetch user." });
    }
};