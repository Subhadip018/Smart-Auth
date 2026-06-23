const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOTPEmail } = require("../services/emailService");

const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const generateJWT = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ─── LOCAL REGISTER ─────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "Email already in use" });
      }
      // User exists but was never verified: update details and send new OTP
      existingUser.name = name || "";
      existingUser.password = password; // hashed by pre-save hook
      const otp = generateOTP();
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      existingUser.otpPurpose = "register";
      await existingUser.save();
      await sendOTPEmail(email, otp, "register");
      return res.json({ message: "Verification code sent to email", email });
    }

    // New user
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = new User({
      name: name || "",
      email,
      password,
      otp,
      otpExpiry,
      otpPurpose: "register",
      isVerified: false,
    });
    await user.save();
    await sendOTPEmail(email, otp, "register");
    res.json({ message: "Verification code sent to email", email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ─── LOCAL LOGIN ────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses Google Login. Please sign in with Google." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      // Send a register verification OTP if they are not verified yet
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.otpPurpose = "register";
      await user.save();
      await sendOTPEmail(email, otp, "register");
      return res.status(403).json({ message: "Please verify your email. OTP has been sent.", unverified: true });
    }

    const token = generateJWT(user._id);
    res.json({
      message: "Logged in successfully",
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ─── RESEND OTP ─────────────────────────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = purpose || "register";
    await user.save();

    await sendOTPEmail(email, otp, user.otpPurpose);
    res.json({ message: "Code resent successfully" });
  } catch (err) {
    console.error("resend-otp error:", err);
    res.status(500).json({ message: "Failed to resend code" });
  }
});

// ─── 1. SEND OTP ──────────────────────────────────────────────────────────────
// Handles both login (existing user) and register (new user)
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existingUser = await User.findOne({ email });
    const purpose = existingUser ? "login" : "register";
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      existingUser.otpPurpose = purpose;
      await existingUser.save();
    } else {
      // Upsert: create placeholder user to store OTP
      await User.findOneAndUpdate(
        { email },
        { otp, otpExpiry, otpPurpose: purpose },
        { upsert: true, new: true }
      );
    }

    await sendOTPEmail(email, otp, purpose);
    res.json({ message: "OTP sent successfully", purpose });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// ─── 2. VERIFY OTP (Login / Register) ────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    await user.save();

    const token = generateJWT(user._id);
    res.json({
      message: "Verified successfully",
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// ─── 3. FORGOT PASSWORD — Send Reset OTP ─────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always respond with success to prevent email enumeration attacks
    if (!user) return res.json({ message: "If this email exists, a code has been sent." });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = "reset";
    await user.save();

    await sendOTPEmail(email, otp, "reset");
    res.json({ message: "If this email exists, a code has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// ─── 4. VERIFY RESET OTP ─────────────────────────────────────────────────────
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otpPurpose: "reset" });
    if (!user || user.otp !== otp)
      return res.status(400).json({ message: "Invalid code" });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: "Code expired. Please request a new one." });

    // Issue a short-lived reset token (not clearing OTP yet — cleared on reset)
    const resetToken = jwt.sign({ id: user._id, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.json({ message: "Code verified", resetToken });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
});

// ─── 5. RESET PASSWORD ────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ message: "Token and new password are required" });
    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    }

    if (decoded.purpose !== "reset")
      return res.status(400).json({ message: "Invalid reset token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword; // hashed by pre-save hook
    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed" });
  }
});

// ─── 6. GOOGLE OAUTH ─────────────────────────────────────────────────────────
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  (req, res) => {
    const token = generateJWT(req.user._id);
    // Redirect to frontend with token in URL (frontend reads and stores it)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// ─── 7. GET CURRENT USER (Protected) ─────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp -otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
