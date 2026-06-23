const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

require("./config/passport");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
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

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Smart Auth API Running");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
