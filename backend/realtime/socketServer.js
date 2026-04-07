const { Server }          = require("socket.io");
const { evaluateMessage } = require("../conversation/safetyEngine");
const { verifyToken }     = require("../utils/jwtHelper");
const pool                = require("../config/db");

module.exports = function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin:  "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace("Bearer ", "");
        if (!token) return next(new Error("No token provided."));
        try {
            const decoded = verifyToken(token);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error("Invalid token."));
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] Connected: user ${socket.userId}`);

        socket.on("join_match", ({ match_id }) => {
            if (!match_id) return;
            socket.join(`match_${match_id}`);
        });

        socket.on("leave_match", ({ match_id }) => {
            if (!match_id) return;
            socket.leave(`match_${match_id}`);
        });

        socket.on("send_message", async ({ match_id, content }) => {
            if (!match_id || !content?.trim()) return;

            try {
                const matchCheck = await pool.query(
                    "SELECT match_status, user1_id, user2_id FROM matches WHERE match_id = $1",
                    [match_id]
                );

                if (matchCheck.rows.length === 0) {
                    return socket.emit("error", { message: "Match not found." });
                }
                if (matchCheck.rows[0].match_status !== "active") {
                    return socket.emit("error", { message: "Match is not active." });
                }

                const { user1_id, user2_id } = matchCheck.rows[0];
                if (socket.userId !== user1_id && socket.userId !== user2_id) {
                    return socket.emit("error", { message: "You are not part of this match." });
                }

                const recipientId = socket.userId === user1_id ? user2_id : user1_id;

                const evaluation = evaluateMessage(
                    parseInt(match_id),
                    socket.userId,
                    recipientId,
                    content.trim()
                );

                if (evaluation.decision === "block") {
                    return socket.emit("message_blocked", {
                        reason:   evaluation.reason,
                        category: evaluation.category
                    });
                }

                if (evaluation.decision === "prompt") {
                    socket.emit("safety_prompt", { reason: evaluation.reason });
                }

                const result = await pool.query(
                    `INSERT INTO message (match_id, sender_id, content, sent_at)
                     VALUES ($1, $2, $3, NOW())
                     RETURNING message_id, match_id, sender_id, content, sent_at`,
                    [match_id, socket.userId, content.trim()]
                );

                io.to(`match_${match_id}`).emit("new_message", result.rows[0]);

            } catch (err) {
                console.error("[Socket] send_message error:", err.message);
                socket.emit("error", { message: "Failed to send message." });
            }
        });

        socket.on("typing", ({ match_id }) => {
            if (!match_id) return;
            socket.to(`match_${match_id}`).emit("user_typing", { user_id: socket.userId });
        });

        socket.on("stop_typing", ({ match_id }) => {
            if (!match_id) return;
            socket.to(`match_${match_id}`).emit("user_stop_typing", { user_id: socket.userId });
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] Disconnected: user ${socket.userId}`);
        });
    });

    return io;
};