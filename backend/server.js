require("dotenv").config();
require("./config/db");

const express = require("express");
const http    = require("http");
const cors    = require("cors");

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;

const initSocketServer = require("./realtime/socketServer");
initSocketServer(server);

app.use(
    cors({
        origin:      true,
        credentials: true,
        methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

const matchRoutes   = require("./routes/match");
const authRoutes    = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/messages");
const dateRoutes    = require("./routes/dates");
const checkinRoutes    = require("./routes/checkin");

app.use("/matches",  matchRoutes);
app.use("/auth",     authRoutes);
app.use("/profile",  profileRoutes);
app.use("/messages", messageRoutes);
app.use("/dates",    dateRoutes);
app.use("/checkin", checkinRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
    console.log(`✅ Aura backend running on port ${PORT}`);
    console.log(`✅ Socket.io initialized on the same port`);
});