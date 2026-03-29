import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

const API = "http://localhost:5000/api";

function statusLabel(s) {
  if (s === "in_progress") return "In progress";
  return s;
}

const StudentSupport = () => {
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
      setSupportRequests(res.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message || "Unable to load support requests."
      );
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
      prev.map((r) =>
        r._id === id ? { ...r, [field]: value } : r
      )
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
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      await fetchRequests();
      setSuccessMessage("Response sent successfully.");
    } catch (e) {
      alert(e?.response?.data?.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const attachmentUrl = (rel) => {
    if (!rel) return "";
    return `http://localhost:5000/uploads/${rel.replace(/^\//, "")}`;
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Student Support</div>
          <button
            type="button"
            className="db-admin-btn"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Support Management</div>
          <h1>
            Student <span>Support Requests</span>
          </h1>
          <p>Review tickets, reply to students, and update status.</p>
        </div>

        <div style={{ marginTop: "40px" }}>
          <div className="db-section-title">Support requests</div>

          {error ? (
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(255,80,80,0.12)",
                border: "1px solid rgba(255,80,80,0.35)",
                color: "#ff8a8a",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(76, 175, 80, 0.14)",
                border: "1px solid rgba(76, 175, 80, 0.45)",
                color: "#b7f5c4",
                marginBottom: "16px",
                fontWeight: 600,
              }}
            >
              {successMessage}
            </div>
          ) : null}

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading…</p>
          ) : supportRequests.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No support requests yet.</p>
          ) : (
            supportRequests.map((req) => (
              <div
                key={req._id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  color: "var(--text)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "1.05rem",
                        fontFamily: "Syne, sans-serif",
                      }}
                    >
                      {req.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--muted)",
                        marginTop: "4px",
                      }}
                    >
                      {req.student?.name || "Student"} ·{" "}
                      {req.student?.email || ""}
                    </div>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background:
                        req.status === "pending"
                          ? "rgba(255, 193, 7, 0.2)"
                          : req.status === "resolved"
                            ? "rgba(76, 175, 80, 0.2)"
                            : "rgba(124, 92, 252, 0.2)",
                      color:
                        req.status === "pending"
                          ? "#ffc107"
                          : req.status === "resolved"
                            ? "#4caf50"
                            : "#c4b5fd",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "capitalize",
                      height: "fit-content",
                    }}
                  >
                    {statusLabel(req.status)}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--muted)",
                    marginBottom: "10px",
                  }}
                >
                  <strong>Category:</strong> {req.category} ·{" "}
                  <strong>Priority:</strong> {req.priority} ·{" "}
                  <strong>Created:</strong>{" "}
                  {req.createdAt
                    ? new Date(req.createdAt).toLocaleString()
                    : "—"}
                </div>

                <div
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.55,
                    marginBottom: "12px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {req.description}
                </div>

                {req.attachment ? (
                  <div style={{ marginBottom: "12px" }}>
                    <a
                      href={attachmentUrl(req.attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent2)", fontWeight: 600 }}
                    >
                      View attachment
                    </a>
                  </div>
                ) : null}

                <div style={{ marginBottom: "8px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--muted)",
                      marginBottom: "6px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={req.status}
                    onChange={(e) =>
                      updateDraft(req._id, "status", e.target.value)
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface2)",
                      color: "var(--text)",
                      minWidth: "160px",
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--muted)",
                      marginBottom: "6px",
                    }}
                  >
                    Admin reply
                  </label>
                  <textarea
                    value={req.adminReply || ""}
                    onChange={(e) =>
                      updateDraft(req._id, "adminReply", e.target.value)
                    }
                    rows={4}
                    placeholder="Type your reply to the student…"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface2)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(req._id)}
                  disabled={savingId === req._id}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(76, 175, 80, 0.2)",
                    color: "#4caf50",
                    border: "1px solid rgba(76, 175, 80, 0.5)",
                    borderRadius: "8px",
                    cursor: savingId === req._id ? "wait" : "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {savingId === req._id ? "Saving…" : "Save reply & status"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSupport;
