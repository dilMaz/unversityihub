import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  // 🔐 Protect Dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login"); // redirect if not logged
      return;
    }

    // call backend protected route
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserId(res.data.userId);
        console.log(res.data);
      } catch (err) {
        console.log(err);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchDashboard();
  }, [navigate]);

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h2>Welcome to UniNotes Dashboard 🎓</h2>
        <p>User ID: {userId}</p>
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
          <button onClick={() => navigate("/top-rated")}>
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
          <button onClick={() => navigate("/profile")}>
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