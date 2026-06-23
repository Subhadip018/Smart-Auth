import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import OTPInput from "../components/OTPInput";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [purpose, setPurpose] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(""); 
    setMessage("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Please enter a valid email address.");
    }
    if (!password) {
      return setError("Please enter a password.");
    }

    if (isRegister) {
      if (password.length < 8) {
        return setError("Password must be at least 8 characters.");
      }
      if (password !== confirmPassword) {
        return setError("Passwords don't match.");
      }
      setLoading(true);
      try {
        await api.post("/auth/register", { name, email, password });
        setPurpose("register");
        setOtpSent(true);
        setMessage(`Verification code sent to ${email}`);
      } catch (err) {
        setError(err.response?.data?.message || "Registration failed. Try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { data } = await api.post("/auth/login", { email, password });
        login(data.token, data.user);
        navigate("/dashboard");
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.unverified) {
          setPurpose("register");
          setOtpSent(true);
          setMessage("Verification code sent to your email. Please verify.");
        } else {
          setError(err.response?.data?.message || "Invalid email or password.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async (otp) => {
    setError(""); 
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(""); 
    setLoading(true);
    try {
      await api.post("/auth/resend-otp", { email, purpose: "register" });
      setMessage(`Code resent to ${email}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1>{otpSent ? "Verify email" : (isRegister ? "Create account" : "Welcome back")}</h1>
          <p>{otpSent ? `Enter the 6-digit code sent to ${email}` : (isRegister ? "Sign up to get started" : "Sign in to your account")}</p>
        </div>

        {!otpSent ? (
          <>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="divider"><span>or</span></div>

            <form onSubmit={handleAuth}>
              {isRegister && (
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={!isRegister}
                />
              </div>

              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="password">Password</label>
                </div>
                <div className="password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus={isRegister}
                  />
                  <button type="button" className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isRegister && (
                <>
                  <div className="field">
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <PasswordStrength password={password} />
                </>
              )}

              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : (isRegister ? "Create account" : "Sign in")}
              </button>
            </form>
          </>
        ) : (
          <div className="otp-section">
            {message && <p className="success-msg">{message}</p>}
            <OTPInput onComplete={handleVerifyOTP} loading={loading} />
            {error && <p className="error">{error}</p>}
            <button className="text-btn" onClick={() => { setOtpSent(false); setError(""); }}>
              ← Back to form
            </button>
            <button className="text-btn" onClick={handleResendOTP} disabled={loading}>
              Resend code
            </button>
          </div>
        )}

        <div className="auth-footer">
          {!otpSent && (
            isRegister ? (
              <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(""); }}>Sign in</a></p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(""); }}>Create one</a></p>
                <p><Link to="/forgot-password">Forgot password?</Link></p>
              </div>
            )
          )}
        </div>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
