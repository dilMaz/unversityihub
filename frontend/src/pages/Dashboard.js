import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";

const cards = [
  {
    cls: "c1",
    icon: "🔍",
    title: "Search Notes",
    desc: "Find any note instantly by keyword, subject, or tag across your entire library.",
    btn: "Search Now",
    route: "/search",
  },
  {
    cls: "c2",
    icon: "⭐",
    title: "Top Rated",
    desc: "Browse the highest-rated notes curated by fellow students and educators.",
    btn: "View Top Notes",
    route: "/top-rated",
  },
  {
    cls: "c3",
    icon: "🤖",
    title: "Recommended",
    desc: "AI-powered suggestions tailored to your study patterns and saved content.",
    btn: "View Suggestions",
    route: "/recommend",
  },
];

const stats = [
  { label: "Notes Saved", value: "248", icon: "📄" },
  { label: "Subjects",    value: "12",  icon: "📚" },
  { label: "Bookmarks",  value: "37",  icon: "🔖" },
  { label: "Streak",     value: "14d", icon: "🔥" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="db-root">
      <div className="db-wrap">

        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-logo">NoteVault</div>
          <button className="db-logout" onClick={logout}>
            <span>↩</span> Sign out
          </button>
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
            <div className="db-stat" key={s.label}>
              <div className="db-stat-label">{s.label}</div>
              <div className="db-stat-value">{s.value}</div>
              <span className="db-stat-accent">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="db-section-title">Quick Actions</div>
        <div className="db-cards">
          {cards.map((c) => (
            <div
              key={c.route}
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

      </div>
    </div>
  );
}

export default Dashboard;
