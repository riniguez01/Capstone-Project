// messageController.js
// POST /messages/send       — send a chat message within a match
// POST /messages/date-request — send a date request (from datePlanner.jsx)

const pool = require("../config/db");

// ─── POST /messages/send ───────────────────────────────────────────────────
// Expects: { match_id, sender_id, content }
exports.sendMessage = async (req, res) => {
    const { match_id, sender_id, content } = req.body;

    if (!match_id || !sender_id || !content) {
        return res.status(400).json({ error: "match_id, sender_id, and content are required." });
    }

    try {
        // Verify the match exists and is active
        const matchCheck = await pool.query(
            "SELECT match_id, match_status FROM matches WHERE match_id = $1",
            [match_id]
        );
        if (matchCheck.rows.length === 0) {
            return res.status(404).json({ error: "Match not found." });
        }
        if (matchCheck.rows[0].match_status !== 'active') {
            return res.status(403).json({ error: "Cannot send messages in an inactive match." });
        }

        const result = await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING message_id, match_id, sender_id, content, sent_at`,
            [match_id, sender_id, content]
        );

        res.status(201).json({ message: "Message sent.", data: result.rows[0] });
    } catch (err) {
        console.error("sendMessage error:", err.message);
        res.status(500).json({ error: "Failed to send message." });
    }
};

// ─── POST /messages/date-request ──────────────────────────────────────────
// Called by datePlanner.jsx when user sends a date request.
// Expects: { match_id, sender_id, venue_type, proposed_datetime }
// Creates both a message (visible in chat) and a date_scheduling record.
exports.sendDateRequest = async (req, res) => {
    const { match_id, sender_id, venue_type, proposed_datetime } = req.body;

    if (!match_id || !sender_id || !venue_type || !proposed_datetime) {
        return res.status(400).json({ error: "match_id, sender_id, venue_type, and proposed_datetime are required." });
    }

    try {
        // Insert into date_scheduling
        const scheduleResult = await pool.query(
            `INSERT INTO date_scheduling (match_id, proposed_datetime, venue_type, status, created_at)
             VALUES ($1, $2, $3, 'pending', NOW())
             RETURNING schedule_id`,
            [match_id, proposed_datetime, venue_type]
        );

        const schedule_id = scheduleResult.rows[0].schedule_id;

        // Also insert a chat message so it appears in the conversation
        const messageText = `📅 Date Request: How about ${venue_type} on ${proposed_datetime}?`;
        await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at)
             VALUES ($1, $2, $3, NOW())`,
            [match_id, sender_id, messageText]
        );

        res.status(201).json({
            message: "Date request sent.",
            schedule_id
        });
    } catch (err) {
        console.error("sendDateRequest error:", err.message);
        res.status(500).json({ error: "Failed to send date request." });
    }
};