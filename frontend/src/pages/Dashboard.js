import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import { API_BASE_URL } from "../config/appConfig";
import {
  buildInsights,
  buildStats,
  getDefaultStats,
  getQuickActions,
  getRecentNotes,
  getSubjectDistribution,
} from "../data/dashboardData";

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getDefaultStats());
  const [notes, setNotes] = useState([]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedRole = localStorage.getItem("userRole") || "user";
    setUserRole(storedRole);

    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch (_err) {
      storedUser = null;
    }

    if (storedUser?.name) {
      setName(storedUser.name);
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
        if (res.data.role) {
          setUserRole(res.data.role);
          localStorage.setItem("userRole", res.data.role);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/notes?search=`);
        const fetchedNotes = Array.isArray(res.data) ? res.data : [];
        setNotes(fetchedNotes);
        setStats(buildStats(fetchedNotes));
      } catch (err) {
        setNotes([]);
        setStats(getDefaultStats());
      }
    };

    fetchDashboard();
    fetchStats();
  }, [navigate]);

  const quickActions = getQuickActions(userRole);
  const recentNotes = getRecentNotes(notes, 4);
  const subjectDistribution = getSubjectDistribution(notes, 4);
  const insights = buildInsights(notes);

  return (
    <div className="db-root">
      <div className="db-wrap">

        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-logo">UniHub</div>
          <div className="db-topbar-actions">
            <button
              type="button"
              className="db-profile-btn"
              onClick={() => navigate("/profile")}
            >
              👤 Profile
            </button>
            <button className="db-logout" onClick={logout}>
              <span>↩</span> Sign out
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="db-hero">
          <div className="db-greeting">Dashboard</div>
          <h1>
            {loading
              ? <span className="db-skeleton" />
              : <>Welcome back, <span>{name}</span></>
            }
          </h1>
          <p>Your academic hub — search, discover, and explore the best notes.</p>
        </div>

        {/* Stats */}
        <div className="db-stats">
          {stats.map((s) => (
            <div className="db-stat" key={s.key || s.label}>
              <div className="db-stat-label">{s.label}</div>
              <div className="db-stat-value">{s.value}</div>
              <span className="db-stat-accent">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="db-section-title">Quick Actions</div>
        <div className="db-cards">
          {quickActions.map((c) => (
            <div
              key={c.id}
              className={`db-card ${c.cls}`}
              onClick={() => navigate(c.route)}
            >
              <div className="db-card-glow" />
              <div className="db-card-icon">{c.icon}</div>
              <div>
                <div className="db-card-title">{c.title}</div>
                <div className="db-card-desc">{c.desc}</div>
              </div>
              <button
                className="db-card-btn"
                onClick={(e) => { e.stopPropagation(); navigate(c.route); }}
              >
                {c.btn} <span className="db-card-arrow">→</span>
              </button>
            </div>
          ))}
        </div>

        <div className="db-section-title">Study Pulse</div>
        <div className="db-grid">
          <div className="db-panel db-insights">
            <h3>Performance Insights</h3>
            <div className="db-insight-list">
              {insights.map((item) => (
                <div className="db-insight-item" key={item.id}>
                  <span className="db-insight-label">{item.label}</span>
                  <strong className="db-insight-value">{item.value}</strong>
                  <small>{item.helper}</small>
                </div>
              ))}
            </div>

            <div className="db-subject-stack">
              {subjectDistribution.length === 0 ? (
                <div className="db-empty">No subject activity yet.</div>
              ) : (
                subjectDistribution.map((item) => (
                  <div className="db-subject-row" key={item.subject}>
                    <div className="db-subject-meta">
                      <span>{item.subject}</span>
                      <span>{item.percent}</span>
                    </div>
                    <div className="db-progress-track">
                      <div className="db-progress-fill" style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="db-panel db-recent">
            <h3>Recent Notes</h3>
            {recentNotes.length === 0 ? (
              <div className="db-empty">Upload notes to see recent activity.</div>
            ) : (
              <div className="db-recent-list">
                {recentNotes.map((note) => (
                  <button
                    key={note._id || `${note.title}-${note.createdAt}`}
                    className="db-recent-item"
                    onClick={() => navigate("/search")}
                  >
                    <span className="db-recent-title">{note.title}</span>
                    <span className="db-recent-meta">
                      {(note.subject || "General") + " • " + (note.downloads || 0) + " downloads"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;