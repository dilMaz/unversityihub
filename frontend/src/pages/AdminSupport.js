import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/adminDashboardUnique.css";
import "../styles/adminSupport.css";

const API = "http://localhost:5000/api";

function statusLabel(status) {
  if (status === "in_progress") return "In progress";
  if (status === "resolved") return "Resolved";
  return "Pending";
}

const AdminSupport = () => {
  const navigate = useNavigate();
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRequests = useCallback(async () => {
    setError("");
    try {
      const res = await axios.get(`${API}/support/admin/all`, {
        headers: authHeaders(),
      });
      setSupportRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load support requests.");
      setSupportRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchRequests();
  }, [navigate, fetchRequests]);

  const updateDraft = (id, field, value) => {
    setSupportRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async (id) => {
    const req = supportRequests.find((r) => r._id === id);
    if (!req) return;

    setSavingId(id);
    setSuccessMessage("");

    try {
      await axios.patch(
        `${API}/support/admin/${id}`,
        {
          adminReply: req.adminReply || "",
          status: req.status,
        },
        {
          headers: { ...authHeaders(), "Content-Type": "application/json" },
        }
      );

      await fetchRequests();
      setSuccessMessage("Response sent successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const attachmentUrl = (relativePath) => {
    if (!relativePath) return "";
    return `http://localhost:5000/uploads/${relativePath.replace(/^\//, "")}`;
  };

  const totalRequests = supportRequests.length;
  const pendingCount = supportRequests.filter((r) => r.status === "pending").length;
  const inProgressCount = supportRequests.filter((r) => r.status === "in_progress").length;
  const resolvedCount = supportRequests.filter((r) => r.status === "resolved").length;

  return (
    <div className="db-root admin-theme admin-support-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Support</div>
          <button
            type="button"
            className="db-logout"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Back to Admin
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Ticket Management</div>
          <h1>
            Support <span>Requests</span>
          </h1>
          <p>Review student tickets, send replies, and update request status.</p>
        </div>

        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-label">Total Tickets</div>
            <div className="db-stat-value">{loading ? "..." : totalRequests}</div>
            <span className="db-stat-accent">🎫</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-label">Pending</div>
            <div className="db-stat-value">{loading ? "..." : pendingCount}</div>
            <span className="db-stat-accent">⏳</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-label">In Progress</div>
            <div className="db-stat-value">{loading ? "..." : inProgressCount}</div>
            <span className="db-stat-accent">🛠️</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-label">Resolved</div>
            <div className="db-stat-value">{loading ? "..." : resolvedCount}</div>
            <span className="db-stat-accent">✅</span>
          </div>
        </div>

        <div className="db-section-title">All support tickets</div>

        {error ? <div className="as-alert as-error">{error}</div> : null}
        {successMessage ? <div className="as-alert as-success">{successMessage}</div> : null}

        {loading ? (
          <div className="as-empty">Loading tickets...</div>
        ) : supportRequests.length === 0 ? (
          <div className="as-empty">No support tickets yet.</div>
        ) : (
          <div className="as-ticket-list">
            {supportRequests.map((req) => (
              <div key={req._id} className="as-ticket-card">
                <div className="as-ticket-head">
                  <div>
                    <h3>{req.title}</h3>
                    <p>
                      {req.student?.name || "Student"}
                      {req.student?.email ? ` · ${req.student.email}` : ""}
                    </p>
                  </div>
                  <span className={`as-status ${req.status}`}>{statusLabel(req.status)}</span>
                </div>

                <div className="as-ticket-meta">
                  <span><strong>Category:</strong> {req.category}</span>
                  <span><strong>Priority:</strong> {req.priority}</span>
                  <span>
                    <strong>Created:</strong>{" "}
                    {req.createdAt ? new Date(req.createdAt).toLocaleString() : "-"}
                  </span>
                </div>

                <div className="as-ticket-desc">{req.description}</div>

                {req.attachment ? (
                  <a
                    className="as-attach-link"
                    href={attachmentUrl(req.attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View attachment
                  </a>
                ) : null}

                <div className="as-form-row">
                  <label htmlFor={`status-${req._id}`}>Status</label>
                  <select
                    id={`status-${req._id}`}
                    value={req.status}
                    onChange={(e) => updateDraft(req._id, "status", e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="as-form-row">
                  <label htmlFor={`reply-${req._id}`}>Admin reply</label>
                  <textarea
                    id={`reply-${req._id}`}
                    rows={4}
                    value={req.adminReply || ""}
                    onChange={(e) => updateDraft(req._id, "adminReply", e.target.value)}
                    placeholder="Type your reply to the student..."
                  />
                </div>

                <button
                  type="button"
                  className="as-save-btn"
                  onClick={() => handleSave(req._id)}
                  disabled={savingId === req._id}
                >
                  {savingId === req._id ? "Saving..." : "Save reply & status"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
