import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/adminAnalytics.css";

function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get("http://localhost:5000/api/admin/analytics/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSummary(res.data?.summary || null);
        setMonthly(Array.isArray(res.data?.monthly) ? res.data.monthly : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  const maxValue = useMemo(() => {
    if (!monthly.length) return 1;
    return Math.max(
      1,
      ...monthly.flatMap((item) => [item.users || 0, item.notes || 0, item.comments || 0])
    );
  }, [monthly]);

  const chartHeight = 190;
  const chartWidth = Math.max(340, monthly.length * 76);

  const trendPoints = useMemo(() => {
    if (!monthly.length) {
      return { users: "", notes: "", comments: "" };
    }

    const makePoints = (key) =>
      monthly
        .map((item, index) => {
          const x = 26 + index * ((chartWidth - 52) / Math.max(1, monthly.length - 1));
          const y = chartHeight - 26 - ((item[key] || 0) / maxValue) * (chartHeight - 50);
          return `${x},${y}`;
        })
        .join(" ");

    return {
      users: makePoints("users"),
      notes: makePoints("notes"),
      comments: makePoints("comments"),
    };
  }, [monthly, chartHeight, chartWidth, maxValue]);

  const contribution = useMemo(() => {
    const users = summary?.totalUsers || 0;
    const notes = summary?.totalNotes || 0;
    const comments = summary?.totalComments || 0;
    const all = Math.max(1, users + notes + comments);

    return [
      {
        key: "users",
        label: "Users",
        value: users,
        percent: Math.round((users / all) * 100),
      },
      {
        key: "notes",
        label: "Notes",
        value: notes,
        percent: Math.round((notes / all) * 100),
      },
      {
        key: "comments",
        label: "Comments",
        value: comments,
        percent: Math.round((comments / all) * 100),
      },
    ];
  }, [summary]);

  const monthlyActivity = useMemo(
    () => monthly.map((item) => ({ ...item, activity: (item.users || 0) + (item.notes || 0) + (item.comments || 0) })),
    [monthly]
  );

  const kpiCards = useMemo(
    () => [
      {
        key: "users",
        label: "Total Users",
        value: summary?.totalUsers ?? 0,
        tone: "violet",
        icon: "U",
      },
      {
        key: "notes",
        label: "Total Notes",
        value: summary?.totalNotes ?? 0,
        tone: "cyan",
        icon: "N",
      },
      {
        key: "comments",
        label: "Total Comments",
        value: summary?.totalComments ?? 0,
        tone: "teal",
        icon: "C",
      },
      {
        key: "downloads",
        label: "Total Downloads",
        value: summary?.totalDownloads ?? 0,
        tone: "amber",
        icon: "D",
      },
    ],
    [summary]
  );

  const maxActivity = useMemo(() => {
    if (!monthlyActivity.length) return 1;
    return Math.max(1, ...monthlyActivity.map((item) => item.activity));
  }, [monthlyActivity]);

  const handleDownloadMonthly = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDownloading(true);
      const res = await axios.get("http://localhost:5000/api/admin/analytics/monthly/download", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const now = new Date();
      link.href = url;
      link.setAttribute(
        "download",
        `admin-monthly-analytics-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to download monthly analytics");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="db-root analytics-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Analytics</div>
          <div className="analytics-topbar-actions">
            <button className="db-admin-btn" onClick={handleDownloadMonthly} disabled={downloading || loading}>
              {downloading ? "Preparing PDF..." : "Download Monthly Analytics (PDF)"}
            </button>
            <button className="db-logout" onClick={() => navigate("/admin-dashboard")}>
              ← Back to Admin
            </button>
          </div>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Website Summary</div>
          <h1>Platform <span>Analytics</span></h1>
          <p>Overview of users, content growth, engagement, and monthly trends.</p>
        </div>

        {error && <div className="error-text">{error}</div>}

        {loading ? (
          <div className="analytics-empty">Loading analytics...</div>
        ) : (
          <>
            <div className="analytics-mini-strip">
              <div className="analytics-mini-chip">
                <span>Admins</span>
                <strong>{summary?.totalAdmins ?? 0}</strong>
              </div>
              <div className="analytics-mini-chip">
                <span>Students</span>
                <strong>{summary?.totalStudents ?? 0}</strong>
              </div>
              <div className="analytics-mini-chip">
                <span>Last 6 Months</span>
                <strong>{monthly.length}</strong>
              </div>
            </div>

            <div className="analytics-summary-grid">
              {kpiCards.map((card) => (
                <div key={card.key} className={`analytics-summary-card tone-${card.tone}`}>
                  <div className="analytics-summary-top">
                    <div className="analytics-summary-label">{card.label}</div>
                    <div className="analytics-summary-icon">{card.icon}</div>
                  </div>
                  <div className="analytics-summary-value">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="analytics-chart-card">
              <div className="analytics-chart-title">Monthly Summary Chart</div>
              <div className="analytics-legend">
                <span><i className="dot users" /> Users</span>
                <span><i className="dot notes" /> Notes</span>
                <span><i className="dot comments" /> Comments</span>
              </div>

              {monthly.length === 0 ? (
                <div className="analytics-empty">No monthly data available.</div>
              ) : (
                <div className="analytics-bars-wrap">
                  {monthly.map((row) => (
                    <div key={row.monthKey} className="analytics-month-group">
                      <div className="analytics-bars">
                        <div
                          className="bar users"
                          style={{ height: `${Math.max(8, ((row.users || 0) / maxValue) * 140)}px` }}
                          title={`Users: ${row.users || 0}`}
                        />
                        <div
                          className="bar notes"
                          style={{ height: `${Math.max(8, ((row.notes || 0) / maxValue) * 140)}px` }}
                          title={`Notes: ${row.notes || 0}`}
                        />
                        <div
                          className="bar comments"
                          style={{ height: `${Math.max(8, ((row.comments || 0) / maxValue) * 140)}px` }}
                          title={`Comments: ${row.comments || 0}`}
                        />
                      </div>
                      <div className="analytics-month-label">{row.monthLabel}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="analytics-diagram-grid">
              <div className="analytics-chart-card colorful-card">
                <div className="analytics-chart-title">Contribution Rings</div>
                <p className="analytics-chart-subtitle">Distribution of users, notes, and comments across the platform.</p>
                <div className="analytics-rings-grid">
                  {contribution.map((item) => (
                    <div key={item.key} className="analytics-ring-item">
                      <div
                        className={`analytics-ring ${item.key}`}
                        style={{ "--ring-percent": `${item.percent}%` }}
                        title={`${item.label}: ${item.value}`}
                      >
                        <span>{item.percent}%</span>
                      </div>
                      <div className="analytics-ring-label">{item.label}</div>
                      <div className="analytics-ring-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-chart-card colorful-card">
                <div className="analytics-chart-title">Trend Wave Diagram</div>
                <p className="analytics-chart-subtitle">Line trend across months for user growth and content activity.</p>
                {monthly.length === 0 ? (
                  <div className="analytics-empty">No monthly data available.</div>
                ) : (
                  <div className="analytics-line-wrap">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="analytics-line-chart" role="img" aria-label="Trend wave chart">
                      <defs>
                        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                        </linearGradient>
                      </defs>
                      {[36, 72, 108, 144].map((yLine) => (
                        <line key={yLine} x1="20" y1={yLine} x2={chartWidth - 20} y2={yLine} stroke="url(#gridFade)" strokeWidth="1" />
                      ))}
                      <polyline points={trendPoints.users} className="trend-line users" />
                      <polyline points={trendPoints.notes} className="trend-line notes" />
                      <polyline points={trendPoints.comments} className="trend-line comments" />
                    </svg>
                    <div className="analytics-month-ticks">
                      {monthly.map((row) => (
                        <span key={row.monthKey}>{row.monthLabel}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="analytics-chart-card colorful-card heat-card">
              <div className="analytics-chart-title">Monthly Activity Heat Strip</div>
              <p className="analytics-chart-subtitle">Higher intensity means a busier month from users, notes, and comments.</p>
              {monthlyActivity.length === 0 ? (
                <div className="analytics-empty">No monthly data available.</div>
              ) : (
                <div className="analytics-heat-wrap">
                  {monthlyActivity.map((item) => {
                    const intensity = Math.max(0.12, item.activity / maxActivity);
                    return (
                      <div key={item.monthKey} className="analytics-heat-cell" title={`${item.monthLabel}: ${item.activity}`}>
                        <div className="analytics-heat-box" style={{ opacity: intensity }} />
                        <div className="analytics-heat-value">{item.activity}</div>
                        <div className="analytics-heat-label">{item.monthLabel}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
