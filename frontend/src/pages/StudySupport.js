import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/study-support.css";

const API = "http://localhost:5000/api";

const CATEGORIES = [
  "Account issue",
  "Wrong note / low quality note",
  "Upload problem",
  "Download problem",
  "Report fake user",
  "Technical bug",
  "Other academic support",
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function statusLabel(s) {
  if (s === "in_progress") return "In progress";
  return s;
}

function StudySupport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [file, setFile] = useState(null);

  const [user, setUser] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadRequests = useCallback(async () => {
    setListLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/support/my`, {
        headers: authHeaders(),
      });
      setRequests(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load your requests.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(u);
    } catch {
      setUser({});
    }
    setLoading(false);
    loadRequests();
  }, [navigate, loadRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("category", category);
      fd.append("description", description.trim());
      fd.append("priority", priority);
      if (file) fd.append("attachment", file);

      await axios.post(`${API}/support`, fd, {
        headers: {
          ...authHeaders(),
        },
      });

      setTitle("");
      setDescription("");
      setCategory(CATEGORIES[0]);
      setPriority("medium");
      setFile(null);
      await loadRequests();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Could not submit your request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const attachmentUrl = (rel) => {
    if (!rel) return "";
    return `http://localhost:5000/uploads/${rel.replace(/^\//, "")}`;
  };

  const canDeleteRequest = (status) => {
    const normalized = String(status || "").toLowerCase();
    return normalized === "resolved" || normalized === "approved";
  };

  const handleDeleteRequest = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this support request?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    try {
      await axios.delete(`${API}/support/${id}`, {
        headers: authHeaders(),
      });
      setRequests((prev) => prev.filter((request) => request._id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete support request.");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-wrap">
          <p className="ss-empty">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">NoteVault</div>
          <button
            type="button"
            className="db-admin-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Profile · Study support</div>
          <h1>
            Get help with <span>notes & account</span>
          </h1>
          <p>
            Submit a request, attach a screenshot if needed, and track status
            here. Your student account is linked automatically.
          </p>
        </div>

        <div className="ss-meta">
          <span>
            <strong>Student ID</strong>{" "}
            {user?.id ? String(user.id) : "—"}
          </span>
          <span>
            <strong>Name</strong> {user?.name || "—"}
          </span>
          <span>
            <strong>Email</strong> {user?.email || "—"}
          </span>
        </div>

        <div className="ss-panel">
          <h2>New support request</h2>
          {formError ? <div className="ss-error">{formError}</div> : null}
          <form className="ss-form-grid" onSubmit={handleSubmit}>
            <div className="ss-field">
              <label htmlFor="ss-title">Request title</label>
              <input
                id="ss-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the issue"
                required
                maxLength={200}
              />
            </div>
            <div className="ss-field">
              <label htmlFor="ss-cat">Category (request type)</label>
              <select
                id="ss-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="ss-field">
              <label htmlFor="ss-pri">Priority</label>
              <select
                id="ss-pri"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ss-field">
              <label htmlFor="ss-desc">Description</label>
              <textarea
                id="ss-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem in detail"
                required
                minLength={10}
              />
            </div>
            <div className="ss-field">
              <label htmlFor="ss-file">Attachment (optional)</label>
              <input
                id="ss-file"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="ss-file-hint">
                Screenshot or document — max 8 MB.
              </div>
            </div>
            <button className="ss-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </div>

        <div className="db-section-title">Your support requests</div>
        {error ? <div className="ss-error">{error}</div> : null}
        {listLoading ? (
          <p className="ss-empty">Loading requests…</p>
        ) : requests.length === 0 ? (
          <div className="ss-panel ss-empty">No requests yet.</div>
        ) : (
          requests.map((r) => (
            <div className="ss-request-card" key={r._id}>
              <div className="ss-request-head">
                <div className="ss-request-title">{r.title}</div>
                <div className="ss-request-head-actions">
                  <span className={`ss-badge ${r.status}`}>
                    {statusLabel(r.status)}
                  </span>
                  {canDeleteRequest(r.status) ? (
                    <button
                      type="button"
                      className="ss-request-delete"
                      onClick={() => handleDeleteRequest(r._id)}
                      disabled={deletingId === r._id}
                    >
                      {deletingId === r._id ? "Deleting..." : "Delete"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="ss-request-meta">
                <strong>Category:</strong> {r.category} ·{" "}
                <strong>Priority:</strong> {r.priority} ·{" "}
                <strong>Created:</strong>{" "}
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleString()
                  : "—"}
              </div>
              <div className="ss-request-desc">{r.description}</div>
              {r.attachment ? (
                <div className="ss-attach">
                  <span>📎</span>
                  <a
                    href={attachmentUrl(r.attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View attachment
                  </a>
                </div>
              ) : null}
              {r.adminReply ? (
                <div className="ss-reply-box">
                  <div className="ss-reply-label">Admin reply</div>
                  <div className="ss-reply-text">{r.adminReply}</div>
                </div>
              ) : (
                <div className="ss-request-meta" style={{ marginTop: 8 }}>
                  No reply yet — we will update this when staff responds.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StudySupport;
