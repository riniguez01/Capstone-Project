const pool            = require("../config/db");
const { evaluateMessage } = require("../conversation/safetyEngine");

exports.sendMessage = async (req, res) => {
    const { match_id, sender_id, content } = req.body;

    if (!match_id || !sender_id || !content) {
        return res.status(400).json({ error: "match_id, sender_id, and content are required." });
    }

    try {
        const matchCheck = await pool.query(
            "SELECT match_id, match_status, user1_id, user2_id FROM matches WHERE match_id = $1",
            [match_id]
        );
        if (matchCheck.rows.length === 0) {
            return res.status(404).json({ error: "Match not found." });
        }
        if (matchCheck.rows[0].match_status !== "active") {
            return res.status(403).json({ error: "Cannot send messages in an inactive match." });
        }

        const { user1_id, user2_id } = matchCheck.rows[0];
        const recipientId = parseInt(sender_id) === user1_id ? user2_id : user1_id;

        const evaluation = evaluateMessage(parseInt(match_id), parseInt(sender_id), parseInt(recipientId), content);

        if (evaluation.decision === "block") {
            return res.status(403).json({
                blocked:  true,
                reason:   evaluation.reason,
                cooldown: evaluation.cooldownApplied,
            });
        }

        const result = await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING message_id, match_id, sender_id, content, sent_at`,
            [match_id, sender_id, content]
        );

        const response = {
            message: "Message sent.",
            data:    result.rows[0],
        };

        if (evaluation.decision === "prompt") {
            response.warning = evaluation.reason;
        }

        res.status(201).json(response);
    } catch (err) {
        console.error("sendMessage error:", err.message);
        res.status(500).json({ error: "Failed to send message." });
    }
};

exports.getMessages = async (req, res) => {
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
        return res.status(400).json({ error: "Invalid match ID." });
    }

    try {
        const result = await pool.query(
            `SELECT message_id, sender_id, content, sent_at, read_at
             FROM message
             WHERE match_id = $1
             ORDER BY sent_at ASC`,
            [matchId]
        );

        await pool.query(
            `UPDATE message SET read_at = NOW()
             WHERE match_id = $1 AND sender_id != $2 AND read_at IS NULL`,
            [matchId, req.user.id]
        );

        res.json({ messages: result.rows });
    } catch (err) {
        console.error("getMessages error:", err.message);
        res.status(500).json({ error: "Failed to fetch messages." });
    }
};

exports.sendDateRequest = async (req, res) => {
    const { match_id, sender_id, venue_type, venue_name, proposed_datetime } = req.body;

    if (!match_id || !sender_id || !venue_type || !proposed_datetime) {
        return res.status(400).json({ error: "match_id, sender_id, venue_type, and proposed_datetime are required." });
    }

    try {
        const scheduleResult = await pool.query(
            `INSERT INTO date_scheduling (match_id, proposed_datetime, venue_type, venue_name, status, created_at)
             VALUES ($1, $2, $3, $4, 'pending', NOW())
             RETURNING schedule_id`,
            [match_id, proposed_datetime, venue_type, venue_name || null]
        );
        const schedule_id = scheduleResult.rows[0].schedule_id;

        const messageText = `📅 Date Request: How about ${venue_name || venue_type} on ${new Date(proposed_datetime).toLocaleString()}?`;
        await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at) VALUES ($1, $2, $3, NOW())`,
            [match_id, sender_id, messageText]
        );

        res.status(201).json({ message: "Date request sent.", schedule_id });
    } catch (err) {
        console.error("sendDateRequest error:", err.message);
        res.status(500).json({ error: "Failed to send date request." });
    }
};