import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="success-icon">✓</div>
        <h1 style={{ marginTop: 16 }}>You're in!</h1>
        <p style={{ color: "#71717a", marginBottom: 8 }}>Signed in as</p>
        <p style={{ fontWeight: 600, color: "#18181b" }}>{user?.email}</p>
        {user?.name && <p style={{ color: "#52525b" }}>{user.name}</p>}
        <button className="primary-btn" style={{ marginTop: 32 }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
