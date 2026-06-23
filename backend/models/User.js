const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null }, // null for Google OAuth users
  name: { type: String, default: "" },
  googleId: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpPurpose: { type: String, enum: ["login", "register", "reset", null], default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
