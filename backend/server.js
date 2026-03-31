require("dotenv").config();
require("./config/db");
const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

const matchRoutes   = require("./routes/match");
const authRoutes    = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/messages");
const checkinRoutes = require("./routes/checkin");

app.use("/matches",  matchRoutes);
app.use("/auth",     authRoutes);
app.use("/profile",  profileRoutes);
app.use("/messages", messageRoutes);
app.use("/checkin",  checkinRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
