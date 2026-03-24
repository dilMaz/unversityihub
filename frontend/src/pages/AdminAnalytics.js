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

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const now = new Date();
      link.href = url;
      link.setAttribute(
        "download",
        `admin-monthly-analytics-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`
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
              {downloading ? "Preparing CSV..." : "Download Monthly Analytics"}
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
            <div className="analytics-summary-grid">
              <div className="analytics-summary-card">
                <div className="analytics-summary-label">Total Users</div>
                <div className="analytics-summary-value">{summary?.totalUsers ?? 0}</div>
              </div>
              <div className="analytics-summary-card">
                <div className="analytics-summary-label">Total Notes</div>
                <div className="analytics-summary-value">{summary?.totalNotes ?? 0}</div>
              </div>
              <div className="analytics-summary-card">
                <div className="analytics-summary-label">Total Comments</div>
                <div className="analytics-summary-value">{summary?.totalComments ?? 0}</div>
              </div>
              <div className="analytics-summary-card">
                <div className="analytics-summary-label">Total Downloads</div>
                <div className="analytics-summary-value">{summary?.totalDownloads ?? 0}</div>
              </div>
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
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
