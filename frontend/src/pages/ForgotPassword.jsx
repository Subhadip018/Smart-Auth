import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import OTPInput from "../components/OTPInput";

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3, DONE: 4 };

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      setResetToken(data.resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword: password });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please start over.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Step progress indicator */}
        <div className="steps-indicator">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-dot ${step >= s ? "active" : ""} ${step > s ? "done" : ""}`} />
          ))}
        </div>

        {step === STEPS.EMAIL && (
          <>
            <div className="auth-header">
              <h1>Reset password</h1>
              <p>Enter your email and we'll send you a verification code.</p>
            </div>
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : "Send verification code"}
              </button>
            </form>
            <div className="auth-footer"><Link to="/login">← Back to login</Link></div>
          </>
        )}

        {step === STEPS.OTP && (
          <>
            <div className="auth-header">
              <h1>Check your email</h1>
              <p>We sent a 6-digit code to <strong>{email}</strong>. Enter it below.</p>
            </div>
            <OTPInput onComplete={handleVerifyOTP} loading={loading} />
            {error && <p className="error">{error}</p>}
            <div className="auth-footer">
              <button className="text-btn" onClick={() => setStep(STEPS.EMAIL)}>← Try another email</button>
              <button className="text-btn" onClick={handleSendCode} disabled={loading}>Resend code</button>
            </div>
          </>
        )}

        {step === STEPS.RESET && (
          <>
            <div className="auth-header">
              <h1>Create new password</h1>
              <p>Choose a strong password for your account.</p>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="field">
                <label htmlFor="password">New password</label>
                <div className="password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <PasswordStrength password={password} />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : "Reset password"}
              </button>
            </form>
          </>
        )}

        {step === STEPS.DONE && (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h1>Password updated!</h1>
            <p>Your password has been reset successfully.</p>
            <button className="primary-btn" onClick={() => navigate("/login")}>
              Go to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

  return (
    <div className="password-strength">
      <div className="strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="strength-bar" style={{ background: i <= strength ? colors[strength] : "#e4e4e7" }} />
        ))}
      </div>
      <span style={{ color: colors[strength], fontSize: "12px" }}>{labels[strength]}</span>
    </div>
  );
}
