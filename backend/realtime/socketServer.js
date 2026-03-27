// socketServer.js
// Feature 3: Real-Time Messaging with Adaptive Conversation Safety
//
// ALL messages pass through safetyEngine.evaluateMessage() BEFORE delivery.
// Blocked messages are never saved to the DB and never shown to the recipient.
//
// Socket events (client → server):
//   register          { userId }                         — map userId to socket
//   join_match        { matchId }                        — enter a chat room
//   send_message      { matchId, senderId, recipientId, content }
//   typing            { matchId, senderId }
//   stop_typing       { matchId, senderId }
//
// Socket events (server → client):
//   receive_message   { message_id, match_id, sender_id, content, sent_at, warned }
//   message_blocked   { reason, category }               — sender only
//   message_warned    { reason, category }               — sender only (soft warning)
//   user_typing       { senderId }                       — other user only
//   user_stopped_typing { senderId }                     — other user only
//   error             { message }

const { Server }          = require('socket.io');
const { evaluateMessage } = require('../conversation/safetyEngine');
const pool                = require('../config/db');

module.exports = function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin:  '*',    // Alex's frontend — tighten in production
            methods: ['GET', 'POST']
        }
    });

    // userId (integer) → socket.id
    // Allows sending targeted events to a specific user
    const userSockets = new Map();

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // ── register ────────────────────────────────────────────────────
        // Client must call this immediately on connect with their userId
        socket.on('register', ({ userId }) => {
            if (!userId) return;
            const uid = parseInt(userId);
            userSockets.set(uid, socket.id);
            socket.userId = uid;
            console.log(`[Socket] User ${uid} registered → ${socket.id}`);
        });

        // ── join_match ──────────────────────────────────────────────────
        // Puts socket into a match room so both users receive messages
        socket.on('join_match', ({ matchId }) => {
            if (!matchId) return;
            const room = `match_${matchId}`;
            socket.join(room);
            console.log(`[Socket] Socket ${socket.id} joined ${room}`);
        });

        // ── send_message ────────────────────────────────────────────────
        // SAFETY INTERCEPTION POINT — evaluate before anything is saved/sent
        socket.on('send_message', async (payload) => {
            const matchId     = parseInt(payload.matchId);
            const senderId    = parseInt(payload.senderId);
            const recipientId = parseInt(payload.recipientId);
            const content     = (payload.content || '').trim();

            // Basic validation
            if (!matchId || !senderId || !recipientId || !content) {
                return socket.emit('error', { message: 'Missing required fields: matchId, senderId, recipientId, content.' });
            }
            if (senderId === recipientId) {
                return socket.emit('error', { message: 'Cannot message yourself.' });
            }

            // ── Feature 3 safety evaluation ───────────────────────────
            // This runs BEFORE any DB write or delivery
            const evaluation = evaluateMessage(matchId, senderId, recipientId, content);

            // BLOCKED — message is dropped entirely
            if (evaluation.decision === 'block') {
                console.log(`[Safety] BLOCKED | match:${matchId} sender:${senderId} | category:${evaluation.category} escalation:${evaluation.escalation}`);
                return socket.emit('message_blocked', {
                    reason:         evaluation.reason,
                    category:       evaluation.category,
                    escalation:     evaluation.escalation,
                    cooldownApplied: evaluation.cooldownApplied
                });
            }

            // PROMPTED — warn the sender but allow the message through
            if (evaluation.decision === 'prompt') {
                console.log(`[Safety] WARNED | match:${matchId} sender:${senderId} | category:${evaluation.category}`);
                socket.emit('message_warned', {
                    reason:   evaluation.reason,
                    category: evaluation.category
                });
                // Fall through — message still gets saved and delivered
            }

            // ── Save to DB ─────────────────────────────────────────────
            try {
                // Verify the match is active before saving
                const matchCheck = await pool.query(
                    'SELECT match_status FROM matches WHERE match_id = $1',
                    [matchId]
                );

                if (matchCheck.rows.length === 0) {
                    return socket.emit('error', { message: 'Match not found.' });
                }
                if (matchCheck.rows[0].match_status !== 'active') {
                    return socket.emit('error', { message: 'Cannot send messages in an inactive match.' });
                }

                const result = await pool.query(
                    `INSERT INTO message (match_id, sender_id, content, sent_at)
                     VALUES ($1, $2, $3, NOW())
                     RETURNING message_id, match_id, sender_id, content, sent_at`,
                    [matchId, senderId, content]
                );

                const saved = result.rows[0];

                // ── Deliver to both users in the match room ────────────
                io.to(`match_${matchId}`).emit('receive_message', {
                    message_id: saved.message_id,
                    match_id:   saved.match_id,
                    sender_id:  saved.sender_id,
                    content:    saved.content,
                    sent_at:    saved.sent_at,
                    warned:     evaluation.decision === 'prompt'   // frontend can show subtle flag
                });

                console.log(`[Socket] Delivered | match:${matchId} from:${senderId} category:${evaluation.category}`);

            } catch (err) {
                console.error('[Socket] send_message DB error:', err.message);
                socket.emit('error', { message: 'Failed to send message. Please try again.' });
            }
        });

        // ── typing indicators ───────────────────────────────────────────
        // Sent to everyone in the room EXCEPT the sender
        socket.on('typing', ({ matchId, senderId }) => {
            if (!matchId || !senderId) return;
            socket.to(`match_${matchId}`).emit('user_typing', { senderId: parseInt(senderId) });
        });

        socket.on('stop_typing', ({ matchId, senderId }) => {
            if (!matchId || !senderId) return;
            socket.to(`match_${matchId}`).emit('user_stopped_typing', { senderId: parseInt(senderId) });
        });

        // ── disconnect ──────────────────────────────────────────────────
        socket.on('disconnect', () => {
            if (socket.userId) {
                userSockets.delete(socket.userId);
                console.log(`[Socket] User ${socket.userId} disconnected`);
            }
        });
    });

    return io;
};