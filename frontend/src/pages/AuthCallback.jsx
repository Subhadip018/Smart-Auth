import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate("/login?error=google_failed");
      return;
    }

    if (token) {
      // Temporarily store token and fetch user info
      localStorage.setItem("token", token);
      api.get("/auth/me")
        .then(({ data }) => {
          login(token, data.user);
          navigate("/dashboard");
        })
        .catch(() => {
          localStorage.removeItem("token");
          navigate("/login?error=auth_failed");
        });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16, color: "#71717a" }}>Completing sign-in…</p>
      </div>
    </div>
  );
}
