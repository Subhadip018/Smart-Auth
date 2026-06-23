const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

require("./config/passport");

const authRoutes = require("./routes/auth");

const app = express();

console.log("CLIENT_URL =", process.env.CLIENT_URL);

app.use(cors({
  origin: process.env.CLIENT_URL || "https://smart-auth-system.netlify.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000
  },
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Smart Auth API Running");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
