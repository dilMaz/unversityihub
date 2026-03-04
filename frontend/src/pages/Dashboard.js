import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header">
        <h2>Welcome to UniNotes Dashboard 🎓</h2>
        <p>Manage your academic notes easily</p>
      </div>

      <div className="card-grid">

        <div className="dashboard-card">
          <h3>📤 Upload Notes</h3>
          <button onClick={() => navigate("/upload")}>
            Go to Upload
          </button>
        </div>

        <div className="dashboard-card">
          <h3>🔍 Search Notes</h3>
          <button onClick={() => navigate("/search")}>
            Search Now
          </button>
        </div>

        <div className="dashboard-card">
          <h3>⭐ Top Rated</h3>
          <button>
            View Top Notes
          </button>
        </div>

        <div className="dashboard-card">
          <h3>📥 My Downloads</h3>
          <button>
            View Downloads
          </button>
        </div>

        <div className="dashboard-card">
          <h3>👤 My Profile</h3>
          <button>
            View Profile
          </button>
        </div>

      </div>

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>

    </div>
  );
}

export default Dashboard;