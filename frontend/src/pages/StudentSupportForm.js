import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

const API = "http://localhost:5000/api";

function StudentSupportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "medium",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("description", formData.description);
      
      if (attachment) {
        formDataToSend.append("attachment", attachment);
      }

      const res = await axios.post(`${API}/support`, formDataToSend, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("SUPPORT REQUEST SUBMITTED:", res.data);
      alert("Support request submitted successfully!");
      setFormData({
        title: "",
        category: "",
        priority: "medium",
        description: "",
      });
      setAttachment(null);

    } catch (err) {
      console.error("Support request error:", err);
      setError(err?.response?.data?.message || "Failed to submit support request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Student Support</div>
          <button
            type="button"
            className="db-admin-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Submit Support Request</div>
          <h1>Get Help from Administrators</h1>
          <p>Submit your issues, questions, or feedback and we'll respond as soon as possible.</p>
        </div>

        {error && (
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(255, 80, 80, 0.12)",
              border: "1px solid rgba(255, 80, 80, 0.35)",
              color: "#ff8a8a",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "40px" }}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text)" }}>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief description of your issue"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text)" }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "1rem",
                }}
              >
                <option value="">Select a category</option>
                <option value="technical">Technical Issue</option>
                <option value="academic">Academic Support</option>
                <option value="account">Account Issue</option>
                <option value="feedback">General Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text)" }}>
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "1rem",
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text)" }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "120px",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text)" }}>
              Attachment (optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.doc,.docx,.jpg,.jpeg,.png"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.9rem",
              }}
            />
            {attachment && (
              <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--muted)" }}>
                Selected: {attachment.name}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "var(--muted)" : "var(--accent)",
              color: loading ? "var(--text)" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "wait" : "pointer",
              width: "100%",
            }}
          >
            {loading ? "Submitting..." : "Submit Support Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentSupportForm;
