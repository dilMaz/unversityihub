import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import AdminFooter from "../components/AdminFooter";
import "../styles/adminDashboardUnique.css";

const normalizeSeries = (series, minHeight = 22, maxHeight = 88) => {
  if (!Array.isArray(series) || series.length === 0) return [];

  const maxValue = Math.max(1, ...series);
  return series.map((value) => {
    const ratio = (value || 0) / maxValue;
    return Math.round(minHeight + ratio * (maxHeight - minHeight));
  });
};

const buildTrendCoordinates = (series) => {
  if (!Array.isArray(series) || series.length === 0) {
    const fallback = [26, 32, 28, 50, 41, 58];
    const left = 28;
    const right = 732;
    const top = 30;
    const bottom = 142;
    const maxValue = Math.max(1, ...fallback);
    const step = (right - left) / Math.max(1, fallback.length - 1);

    return fallback.map((value, index) => ({
      x: left + index * step,
      y: bottom - (value / maxValue) * (bottom - top),
      value,
    }));
  }

  const left = 28;
  const right = 732;
  const top = 30;
  const bottom = 142;
  const maxValue = Math.max(1, ...series);
  const step = (right - left) / Math.max(1, series.length - 1);

  return series.map((value, index) => ({
    x: left + index * step,
    y: bottom - ((value || 0) / maxValue) * (bottom - top),
    value: value || 0,
  }));
};

const buildTrendPath = (points) => {
  if (!Array.isArray(points) || points.length === 0) return "";
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsMonthly, setAnalyticsMonthly] = useState([]);
  const [pendingCount, setPendingCount] = useState(null);
  const [liveError, setLiveError] = useState("");

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

    const fetchLiveDiagrams = async () => {
      try {
        const [analyticsRes, pendingRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/analytics/summary", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/notes/review/pending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAnalyticsSummary(analyticsRes.data?.summary || null);
        setAnalyticsMonthly(Array.isArray(analyticsRes.data?.monthly) ? analyticsRes.data.monthly : []);
        setPendingCount(Array.isArray(pendingRes.data) ? pendingRes.data.length : 0);
      } catch (err) {
        setLiveError(err?.response?.data?.message || "Unable to fetch live chart data");
      }
    };

    fetchDashboard();
    fetchUsers();
    fetchLiveDiagrams();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const fallbackAdminCount = usersLoading
    ? "..."
    : users.filter((u) => (u.role || "").toLowerCase() === "admin").length;

  const fallbackStudentCount = usersLoading
    ? "..."
    : users.filter((u) => (u.role || "").toLowerCase() !== "admin").length;

  const fallbackTotalUsers = usersLoading ? "..." : users.length;

  const adminCount = analyticsSummary?.totalAdmins ?? fallbackAdminCount;
  const studentCount = analyticsSummary?.totalStudents ?? fallbackStudentCount;
  const totalUsers = analyticsSummary?.totalUsers ?? fallbackTotalUsers;

  const recentMonths = analyticsMonthly.slice(-7);
  const activityRaw = recentMonths.map((m) => (m.users || 0) + (m.notes || 0) + (m.comments || 0));
  const moderationRaw = recentMonths.map((m) => m.notes || 0);
  const engagementRaw = recentMonths.map((m) => m.comments || 0);
  const monthLabels = recentMonths.map((m, index) => {
    const label = (m?.monthLabel || "").split(" ")[0];
    return label || `M${index + 1}`;
  });

  const activityBars = normalizeSeries(activityRaw.length ? activityRaw : [72, 54, 39, 48, 67, 80, 58]);
  const moderationBars = normalizeSeries(moderationRaw.length ? moderationRaw : [20, 26, 18, 22, 31, 28, 36]);
  const engagementBars = normalizeSeries(engagementRaw.length ? engagementRaw : [44, 30, 53, 35, 22, 29, 41]);
  const trendCoordinates = buildTrendCoordinates(activityRaw);
  const trendPath = buildTrendPath(trendCoordinates);

  const activityTotal = activityRaw.reduce((sum, value) => sum + value, 0);
  const moderationTotal = moderationRaw.reduce((sum, value) => sum + value, 0);
  const engagementTotal = engagementRaw.reduce((sum, value) => sum + value, 0);
  const latestMonth = recentMonths[recentMonths.length - 1]?.monthLabel || "Current month";
  const latestActivity = activityRaw[activityRaw.length - 1] ?? 0;

  const summaryCards = [
    { id: "users", label: "Total Users", value: totalUsers, tone: "teal" },
    { id: "admins", label: "Admin Accounts", value: adminCount, tone: "violet" },
    { id: "students", label: "Student Accounts", value: studentCount, tone: "pink" },
    { id: "reviews", label: "Pending Review", value: pendingCount ?? "...", tone: "cyan" },
  ];

  const navItems = [
    { id: "overview", label: "Overview", action: () => navigate("/admin-dashboard") },
    { id: "users", label: "Users", action: () => navigate("/admin-users") },
    { id: "videos", label: "Videos", action: () => navigate("/admin-videos") },
    { id: "support", label: "Support Tickets", action: () => navigate("/admin-student-support") },
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

          {(usersError || liveError) && <div className="adm-inline-error">{usersError || liveError}</div>}

          <div className="adm-graph-card">
            <div className="adm-chart-head">
              <div>
                <div className="adm-card-title">Steps Overview</div>
                <div className="adm-card-subtitle">Total monthly platform actions (users + notes + comments)</div>
              </div>
              <div className="adm-chart-stat">{latestMonth}: {latestActivity}</div>
            </div>
            <svg viewBox="0 0 760 180" className="adm-trend-svg" role="img" aria-label="Activity trend line">
              {[38, 74, 110, 146].map((yLine) => (
                <line
                  key={yLine}
                  x1="24"
                  y1={yLine}
                  x2="736"
                  y2={yLine}
                  className="adm-trend-grid"
                />
              ))}
              <polyline
                points={trendPath}
                className="adm-trend-path"
              />
              {trendCoordinates.map((point, index) => (
                <g key={`trend-point-${index}`}>
                  <circle cx={point.x} cy={point.y} r="3.6" className="adm-trend-point" />
                  <text x={point.x} y={point.y - 8} textAnchor="middle" className="adm-trend-value">
                    {point.value}
                  </text>
                  <text x={point.x} y="166" textAnchor="middle" className="adm-trend-month">
                    {monthLabels[index] || `M${index + 1}`}
                  </text>
                </g>
              ))}
            </svg>
            <div className="adm-chart-footer">
              <div>Period: {monthLabels.join(" | ") || "Live"}</div>
              <div>Total Actions: {activityTotal}</div>
            </div>
          </div>

          <div className="adm-mini-grid">
            <div className="adm-mini-card">
              <div className="adm-chart-head compact">
                <div className="adm-card-title">User Activity</div>
                <div className="adm-mini-total">Total: {activityTotal}</div>
              </div>
              <div className="adm-bars">
                {activityBars.map((value, index) => (
                  <div key={`ua-${index}`} className="adm-bar-stack" title={`${monthLabels[index] || `M${index + 1}`}: ${activityRaw[index] || 0}`}>
                    <span className="adm-bar-value">{activityRaw[index] || 0}</span>
                    <div className="adm-bar amber" style={{ height: `${value}px` }} />
                    <span className="adm-bar-label">{monthLabels[index] || `M${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="adm-mini-card">
              <div className="adm-chart-head compact">
                <div className="adm-card-title">Moderation Load</div>
                <div className="adm-mini-total">Notes: {moderationTotal}</div>
              </div>
              <div className="adm-bars">
                {moderationBars.map((value, index) => (
                  <div key={`ml-${index}`} className="adm-bar-stack" title={`${monthLabels[index] || `M${index + 1}`}: ${moderationRaw[index] || 0}`}>
                    <span className="adm-bar-value">{moderationRaw[index] || 0}</span>
                    <div className="adm-bar pink" style={{ height: `${value}px` }} />
                    <span className="adm-bar-label">{monthLabels[index] || `M${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="adm-mini-card">
              <div className="adm-chart-head compact">
                <div className="adm-card-title">Engagement</div>
                <div className="adm-mini-total">Comments: {engagementTotal}</div>
              </div>
              <div className="adm-bars">
                {engagementBars.map((value, index) => (
                  <div key={`eg-${index}`} className="adm-bar-stack" title={`${monthLabels[index] || `M${index + 1}`}: ${engagementRaw[index] || 0}`}>
                    <span className="adm-bar-value">{engagementRaw[index] || 0}</span>
                    <div className="adm-bar blue" style={{ height: `${value}px` }} />
                    <span className="adm-bar-label">{monthLabels[index] || `M${index + 1}`}</span>
                  </div>
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

      <AdminFooter />
    </div>
  );
}

export default AdminDashboard;