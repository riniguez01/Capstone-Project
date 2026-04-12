const pool = require("../config/db");
const { evaluateMessage } = require("../conversation/safetyEngine");
const initSocketServer = require("../realtime/socketServer");

function emitNewChatMessage(matchId, row) {
    if (!row) return;
    const io = typeof initSocketServer.getIO === "function" ? initSocketServer.getIO() : null;
    if (!io) return;
    const mid = parseInt(String(matchId), 10);
    if (Number.isNaN(mid)) return;
    io.to(`match_${mid}`).emit("new_message", row);
}

exports.sendDateRequest = async (req, res) => {
    const { match_id, sender_id, venue_type, venue_name, proposed_datetime } = req.body;

    if (!match_id || !sender_id || !venue_type || !proposed_datetime) {
        return res.status(400).json({ error: "match_id, sender_id, venue_type, and proposed_datetime are required." });
    }

    const jwtUserId = parseInt(req.user.id, 10);
    if (parseInt(sender_id, 10) !== jwtUserId) {
        return res.status(403).json({ error: "sender_id must match the signed-in user." });
    }

    try {
        const weeklyCount = await pool.query(
            `SELECT COUNT(*) AS count FROM notifications
             WHERE type = 'date_request'
               AND (payload->>'sender_id')::int = $1
               AND created_at >= date_trunc('week', NOW())`,
            [parseInt(sender_id)]
        );

        const sentThisWeek = parseInt(weeklyCount.rows[0].count);
        if (sentThisWeek >= 3) {
            return res.status(429).json({
                error: "You have reached your weekly date request limit of 3. Resets every Monday.",
                requests_used: sentThisWeek,
                resets_on: "Monday",
            });
        }

        const matchResult = await pool.query(
            `SELECT user1_id, user2_id FROM matches WHERE match_id = $1 AND match_status = 'active'`,
            [match_id]
        );
        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: "Match not found or inactive." });
        }

        const { user1_id, user2_id } = matchResult.rows[0];
        const recipient_id = parseInt(sender_id) === user1_id ? user2_id : user1_id;

        const senderResult = await pool.query(
            `SELECT first_name, last_name FROM users WHERE user_id = $1`,
            [parseInt(sender_id)]
        );

        const senderName = senderResult.rows.length > 0
            ? `${senderResult.rows[0].first_name || ""} ${senderResult.rows[0].last_name || ""}`.trim()
            : "Unknown";

        const scheduleResult = await pool.query(
            `INSERT INTO date_scheduling (match_id, proposed_datetime, venue_type, venue_name, status, created_at)
             VALUES ($1, $2, $3, $4, 'pending', NOW())
             RETURNING schedule_id`,
            [match_id, proposed_datetime, venue_type, venue_name || null]
        );
        const schedule_id = scheduleResult.rows[0].schedule_id;

        const chatLine = `📅 Date Request: How about ${venue_name || venue_type} on ${new Date(proposed_datetime).toLocaleString()}?`;
        const safety = await evaluateMessage(
            parseInt(match_id, 10),
            parseInt(sender_id, 10),
            recipient_id,
            chatLine
        );
        if (safety.decision === "block") {
            await pool.query(`DELETE FROM date_scheduling WHERE schedule_id = $1`, [schedule_id]);
            return res.status(403).json({
                error:    safety.reason,
                blocked:  true,
                reason:   safety.reason,
                cooldown: safety.cooldownApplied,
            });
        }

        const msgInsert = await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING message_id, match_id, sender_id, content, sent_at`,
            [match_id, sender_id, chatLine]
        );
        emitNewChatMessage(match_id, msgInsert.rows[0]);

        await pool.query(
            `INSERT INTO notifications (user_id, type, payload, is_read, created_at)
             VALUES ($1, 'date_request', $2, false, NOW())`,
            [recipient_id, JSON.stringify({
                schedule_id,
                sender_id:   parseInt(sender_id),
                sender_name: senderName,
                venue_name,
                proposed_datetime,
                match_id,
            })]
        );

        const payload = {
            message:       "Date request sent.",
            schedule_id,
            requests_left: 3 - (sentThisWeek + 1),
        };
        if (safety.decision === "prompt") {
            payload.warning = safety.reason;
        }
        res.status(201).json(payload);
    } catch (err) {
        console.error("sendDateRequest error:", err.message);
        res.status(500).json({ error: "Failed to send date request." });
    }
};

exports.respondToDate = async (req, res) => {
    const { scheduleId } = req.params;
    const { response } = req.body;
    const responderId = parseInt(req.user.id, 10);

    if (!["approved", "rejected"].includes(response)) {
        return res.status(400).json({ error: "Response must be 'approved' or 'rejected'." });
    }

    try {
        const sid = parseInt(scheduleId, 10);
        if (Number.isNaN(sid)) {
            return res.status(400).json({ error: "Invalid schedule id." });
        }

        const pending = await pool.query(
            `SELECT ds.schedule_id, ds.match_id, ds.proposed_datetime, ds.venue_name, ds.status,
                    m.user1_id, m.user2_id,
                    (SELECT (payload->>'sender_id')::int FROM notifications
                     WHERE type = 'date_request' AND (payload->>'schedule_id')::int = ds.schedule_id
                     LIMIT 1) AS requester_id
             FROM date_scheduling ds
             JOIN matches m ON m.match_id = ds.match_id
             WHERE ds.schedule_id = $1`,
            [sid]
        );

        if (pending.rows.length === 0) {
            return res.status(404).json({ error: "Date not found." });
        }

        const pr = pending.rows[0];
        if (pr.status !== "pending") {
            return res.status(409).json({ error: "This date has already been responded to." });
        }

        const u1 = parseInt(pr.user1_id, 10);
        const u2 = parseInt(pr.user2_id, 10);
        const requesterId = pr.requester_id != null ? parseInt(pr.requester_id, 10) : null;

        if (responderId !== u1 && responderId !== u2) {
            return res.status(403).json({ error: "You are not part of this match." });
        }
        if (requesterId != null && responderId === requesterId) {
            return res.status(403).json({ error: "Only the recipient can respond to this request." });
        }
        if (requesterId == null) {
            return res.status(400).json({ error: "Could not verify the original date request." });
        }

        const result = await pool.query(
            `UPDATE date_scheduling SET status = $1 WHERE schedule_id = $2 AND status = 'pending'
             RETURNING match_id, proposed_datetime, venue_name`,
            [response, sid]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: "This date has already been responded to." });
        }

        const { match_id, proposed_datetime, venue_name } = result.rows[0];

        await pool.query(
            `UPDATE notifications SET is_read = true
             WHERE type = 'date_request'
               AND (payload->>'schedule_id')::int = $1`,
            [sid]
        );

        const other_user_id = responderId === u1 ? u2 : u1;

        const responderResult = await pool.query(
            `SELECT first_name, last_name FROM users WHERE user_id = $1`,
            [responderId]
        );
        const responderName = responderResult.rows.length > 0
            ? `${responderResult.rows[0].first_name || ""} ${responderResult.rows[0].last_name || ""}`.trim()
            : "Your match";

        const statusVerb = response === "approved" ? "accepted" : "declined";
        const chatLine = `📅 ${responderName} ${statusVerb} the date request.`;

        const msgInsert = await pool.query(
            `INSERT INTO message (match_id, sender_id, content, sent_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING message_id, match_id, sender_id, content, sent_at`,
            [match_id, responderId, chatLine]
        );
        emitNewChatMessage(match_id, msgInsert.rows[0]);

        if (response === "approved") {
            await pool.query(
                `INSERT INTO notifications (user_id, type, payload, is_read, created_at)
                 VALUES ($1, 'date_accepted', $2, false, NOW())`,
                [other_user_id, JSON.stringify({
                    schedule_id:    sid,
                    venue_name,
                    proposed_datetime,
                    responder_name: responderName,
                })]
            );

            await pool.query(
                `INSERT INTO survey_trigger (schedule_id, user1_id, user2_id, trigger_at, sent, created_at)
                 VALUES ($1, $2, $3, $4::timestamptz, false, NOW())
                 ON CONFLICT (schedule_id) DO NOTHING`,
                [sid, user1_id, user2_id, proposed_datetime]
            );
        } else {
            await pool.query(
                `INSERT INTO notifications (user_id, type, payload, is_read, created_at)
                 VALUES ($1, 'date_declined', $2, false, NOW())`,
                [other_user_id, JSON.stringify({
                    schedule_id:    sid,
                    venue_name,
                    proposed_datetime,
                    responder_name: responderName,
                })]
            );
        }

        res.json({ message: `Date ${response}.` });
    } catch (err) {
        console.error("respondToDate error:", err.message);
        res.status(500).json({ error: "Failed to respond to date." });
    }
};

exports.getNotifications = async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const result = await pool.query(
            `SELECT notification_id, type, payload, is_read, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [userId]
        );

        const notifications = result.rows.map(n => ({
            ...n,
            payload: typeof n.payload === "string" ? JSON.parse(n.payload) : n.payload,
        }));

        res.json({ notifications });
    } catch (err) {
        console.error("getNotifications error:", err.message);
        res.status(500).json({ error: "Failed to fetch notifications." });
    }
};

exports.submitPostDateSurvey = async (req, res) => {
    const userId = req.user.id;
    const { schedule_id, comfortScore, feltSafe, boundariesRespected, feltPressured, wouldSeeAgain, comments } = req.body;

    if (!schedule_id || feltPressured === undefined || !wouldSeeAgain) {
        return res.status(400).json({ error: "schedule_id, feltPressured, and wouldSeeAgain are required." });
    }

    try {
        const schedResult = await pool.query(
            `SELECT ds.match_id, m.user1_id, m.user2_id
             FROM date_scheduling ds
             JOIN matches m ON m.match_id = ds.match_id
             WHERE ds.schedule_id = $1`,
            [schedule_id]
        );

        if (schedResult.rows.length === 0) {
            return res.status(404).json({ error: "Schedule not found." });
        }

        const { user1_id, user2_id } = schedResult.rows[0];
        const reviewed_user_id = parseInt(userId) === user1_id ? user2_id : user1_id;

        await pool.query(
            `INSERT INTO post_date_checkin
                (schedule_id, reviewer_user_id, reviewed_user_id,
                 comfort_level, felt_safe, boundaries_respected,
                 felt_pressured, would_meet_again, short_comment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
                schedule_id,
                userId,
                reviewed_user_id,
                comfortScore || null,
                feltSafe === "Yes",
                boundariesRespected === "Yes",
                feltPressured === "Yes",
                wouldSeeAgain,
                comments || null,
            ]
        );

        if (feltPressured === "Yes") {
            await pool.query(
                `UPDATE trust_score
                 SET internal_score = GREATEST(0, internal_score - 10),
                     last_updated = NOW()
                 WHERE user_id = $1`,
                [reviewed_user_id]
            );
        } else if (wouldSeeAgain === "Yes") {
            await pool.query(
                `UPDATE trust_score
                 SET internal_score = LEAST(100, internal_score + 5),
                     last_updated = NOW()
                 WHERE user_id = $1`,
                [reviewed_user_id]
            );
        }

        res.status(201).json({ message: "Survey submitted." });
    } catch (err) {
        console.error("submitPostDateSurvey error:", err.message);
        res.status(500).json({ error: "Failed to submit survey." });
    }
};

exports.checkAndSendSurveys = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT st.*, ds.proposed_datetime, ds.venue_name
             FROM survey_trigger st
             JOIN date_scheduling ds ON ds.schedule_id = st.schedule_id
             WHERE st.sent = false
               AND st.trigger_at <= NOW()`
        );

        for (const trigger of result.rows) {
            const surveyPayload = JSON.stringify({
                schedule_id: trigger.schedule_id,
                venue_name:  trigger.venue_name,
            });

            await pool.query(
                `INSERT INTO notifications (user_id, type, payload, is_read, created_at)
                 VALUES ($1, 'post_date_survey', $2, false, NOW()),
                        ($3, 'post_date_survey', $2, false, NOW())`,
                [trigger.user1_id, surveyPayload, trigger.user2_id]
            );

            await pool.query(
                `UPDATE survey_trigger SET sent = true WHERE schedule_id = $1`,
                [trigger.schedule_id]
            );
        }

        res.json({ triggered: result.rows.length });
    } catch (err) {
        console.error("checkAndSendSurveys error:", err.message);
        res.status(500).json({ error: "Survey check failed." });
    }
};