import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/adminDashboardUnique.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // ✅ Fix 1 — role check කරන්න — admin නොවෙනම් dashboard එකට
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.role?.toLowerCase() !== "admin") {
      navigate("/dashboard");
      return;
    }

    // ✅ Fix 2 — localStorage user data use කරන්න
    if (storedUser?.name) {
      setName(storedUser.name);
      setLoading(false);
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // ✅ Fix 3 — 401 එකට විතරක් token delete කරන්න
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        setUsersError(err?.response?.data?.message || "Unable to fetch users");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchDashboard();
    fetchUsers();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const adminCount = usersLoading
    ? "..."
    : users.filter((u) => (u.role || "").toLowerCase() === "admin").length;

  const studentCount = usersLoading
    ? "..."
    : users.filter((u) => (u.role || "").toLowerCase() !== "admin").length;

  const totalUsers = usersLoading ? "..." : users.length;

  const summaryCards = [
    { id: "users", label: "Total Users", value: totalUsers, tone: "teal" },
    { id: "admins", label: "Admin Accounts", value: adminCount, tone: "violet" },
    { id: "students", label: "Student Accounts", value: studentCount, tone: "pink" },
    { id: "reviews", label: "Pending Review", value: "Live", tone: "cyan" },
  ];

  const activityBars = [72, 54, 39, 48, 67, 80, 58];
  const moderationBars = [20, 26, 18, 22, 31, 28, 36];
  const engagementBars = [44, 30, 53, 35, 22, 29, 41];

  const navItems = [
    { id: "overview", label: "Overview", action: () => navigate("/admin-dashboard") },
    { id: "users", label: "Users", action: () => navigate("/admin-users") },
    { id: "review", label: "Review", action: () => navigate("/admin-review") },
    { id: "analytics", label: "Analytics", action: () => navigate("/admin-analytics") },
    { id: "comments", label: "Comments", action: () => navigate("/admin-comments") },
    { id: "register", label: "Register Admin", action: () => navigate("/admin-panel") },
    { id: "all-admin", label: "All Admin", action: () => navigate("/admin-users?role=admin") },
  ];

  return (
    <div className="adm-root">
      <div className="adm-shell">
        <aside className="adm-sidebar">
          <div className="adm-brand">Admin Console</div>
          <div className="adm-nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`adm-nav-btn ${item.id === "overview" ? "active" : ""}`}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="adm-signout" onClick={logout}>
            Sign Out
          </button>
        </aside>

        <main className="adm-main">
          <div className="adm-top">
            <div>
              <div className="adm-kicker">Admin Dashboard</div>
              <h1>{loading ? "Welcome..." : `Welcome, ${name}`}</h1>
              <p>Monitor users, moderation, and platform health from one place.</p>
            </div>
            <button type="button" className="adm-primary" onClick={() => navigate('/admin-review')}>
              Open Reviews
            </button>
          </div>

          <div className="adm-summary-grid">
            {summaryCards.map((card) => (
              <div key={card.id} className={`adm-summary-card ${card.tone}`}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>

          {usersError && <div className="adm-inline-error">{usersError}</div>}

          <div className="adm-graph-card">
            <div className="adm-card-title">Steps Overview</div>
            <svg viewBox="0 0 760 180" className="adm-trend-svg" role="img" aria-label="Activity trend line">
              <polyline
                points="0,130 40,120 80,126 120,94 160,108 200,84 240,88 280,64 320,72 360,60 400,78 440,57 480,63 520,58 560,69 600,96 640,84 680,92 720,76 760,82"
                className="adm-trend-path"
              />
            </svg>
          </div>

          <div className="adm-mini-grid">
            <div className="adm-mini-card">
              <div className="adm-card-title">User Activity</div>
              <div className="adm-bars">
                {activityBars.map((value, index) => (
                  <div key={`ua-${index}`} className="adm-bar amber" style={{ height: `${value}%` }} />
                ))}
              </div>
            </div>
            <div className="adm-mini-card">
              <div className="adm-card-title">Moderation Load</div>
              <div className="adm-bars">
                {moderationBars.map((value, index) => (
                  <div key={`ml-${index}`} className="adm-bar pink" style={{ height: `${value + 25}%` }} />
                ))}
              </div>
            </div>
            <div className="adm-mini-card">
              <div className="adm-card-title">Engagement</div>
              <div className="adm-bars">
                {engagementBars.map((value, index) => (
                  <div key={`eg-${index}`} className="adm-bar blue" style={{ height: `${value}%` }} />
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className="adm-right">
          <div className="adm-profile-card">
            <div className="adm-avatar">{(name || "A").charAt(0).toUpperCase()}</div>
            <h3>{loading ? "Admin" : name}</h3>
            <p>System Administrator</p>
            <div className="adm-profile-stats">
              <div>
                <span>Users</span>
                <strong>{totalUsers}</strong>
              </div>
              <div>
                <span>Admins</span>
                <strong>{adminCount}</strong>
              </div>
              <div>
                <span>Students</span>
                <strong>{studentCount}</strong>
              </div>
            </div>
          </div>

          <div className="adm-schedule-card">
            <div className="adm-card-title">Scheduled</div>
            <div className="adm-schedule-item">
              <strong>Document Review</strong>
              <span>Today, 11:00 AM</span>
            </div>
            <div className="adm-schedule-item">
              <strong>Admin Audit</strong>
              <span>Tomorrow, 09:30 AM</span>
            </div>
            <div className="adm-schedule-item">
              <strong>Analytics Export</strong>
              <span>Friday, 03:00 PM</span>
            </div>
          </div>

          <div className="adm-quick-card">
            <div className="adm-card-title">Quick Actions</div>
            <button className="adm-quick-btn" onClick={() => navigate('/admin-panel')}>Register Admin</button>
            <button className="adm-quick-btn" onClick={() => navigate('/admin-users?role=admin')}>All Admin</button>
            <button className="adm-quick-btn" onClick={() => navigate('/admin-comments')}>Review Comments</button>
            <button className="adm-quick-btn" onClick={() => navigate('/admin-analytics')}>Open Analytics</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminDashboard;