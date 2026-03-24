import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/userSupport.css";

function UserSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userDetails, setUserDetails] = useState({ name: "", email: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const [formData, setFormData] = useState({
    subject: "",
    category: "other",
    message: "",
    priority: "medium",
  });

  const token = localStorage.getItem("token");

  // Fetch user details and tickets
  useEffect(() => {
    fetchUserDetails();
    fetchTickets();
  }, []);

  const fetchUserDetails = async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserDetails({
        name: res.data.name,
        email: res.data.email,
      });
    } catch (err) {
      console.error("Failed to fetch user details", err);
    }
  };

  const fetchTickets = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/support/my-tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Subject and message are required");
      return;
    }

    setPosting(true);

    try {
      const res = await axios.post("http://localhost:5000/api/support", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ticket = res.data.ticket;
      setSubmittedTicket(ticket);
      setShowConfirmation(true);
      setSuccessMessage("Support ticket created successfully! ✓");

      // Refresh tickets
      await fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setPosting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setSubmittedTicket(null);
    setFormData({
      subject: "",
      category: "other",
      message: "",
      priority: "medium",
    });
    setShowForm(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      open: "#ffc107",
      "in-progress": "#2196f3",
      resolved: "#4caf50",
      closed: "#9e9e9e",
    };
    return colors[status] || "#999";
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: "#4caf50",
      medium: "#2196f3",
      high: "#f44336",
    };
    return colors[priority] || "#999";
  };

  return (
    <div className="user-support-root">
      <div className="user-support-container">
        {/* Header */}
        <div className="support-header">
          <div className="support-header-content">
            <span className="support-icon">🎯</span>
            <div className="support-title-group">
              <h1>Student Support</h1>
              <p>Submit and track your support requests</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="support-alert support-alert-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="support-alert support-alert-success">
            <span>✓</span>
            {successMessage}
          </div>
        )}

        {/* New Ticket Button */}
        <div className="support-actions">
          <button
            className="new-ticket-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel ✕" : "+ New Support Ticket"}
          </button>
        </div>

        {/* Form Section */}
        {showForm && !showConfirmation && (
          <div className="support-form-section">
            <h3 className="form-title">Submit a New Support Request</h3>

            {/* User Details Box */}
            <div className="user-details-box">
              <div className="user-details-header">
                <span className="user-icon">👤</span>
                <h4>Your Information</h4>
              </div>
              <div className="user-details-content">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{userDetails.name || "Loading..."}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{userDetails.email || "Loading..."}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What is your issue about?"
                    maxLength="200"
                    required
                  />
                  <small>{formData.subject.length}/200</small>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="content">Content Quality</option>
                    <option value="account">Account Issue</option>
                    <option value="billing">Billing/Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your issue in detail..."
                  maxLength="2000"
                  rows="6"
                  required
                />
                <small>{formData.message.length}/2000</small>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={posting}
              >
                {posting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* Confirmation Section */}
        {showConfirmation && submittedTicket && (
          <div className="confirmation-section">
            <div className="confirmation-header">
              <span className="checkmark-icon">✓</span>
              <h3>Ticket Submitted Successfully!</h3>
              <p>Your support request has been received. Our team will get back to you soon.</p>
            </div>

            <div className="confirmation-details">
              {/* Ticket Summary */}
              <div className="confirmation-card">
                <h4 className="confirmation-title">📋 Ticket Details</h4>

                <div className="detail-section">
                  <div className="detail-item">
                    <span className="label">Ticket ID:</span>
                    <span className="value ticket-id">{submittedTicket._id?.substring(0, 8)}...</span>
                  </div>
                </div>

                {/* User Details */}
                <div className="confirmation-subsection">
                  <h5 className="subsection-title">👤 Your Details</h5>
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{userDetails.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{userDetails.email}</span>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="confirmation-subsection">
                  <h5 className="subsection-title">📝 Issue Details</h5>
                  <div className="detail-item">
                    <span className="label">Subject:</span>
                    <span className="value">{submittedTicket.subject}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value badge-value">{submittedTicket.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Priority:</span>
                    <span className={`value badge-value priority-${submittedTicket.priority}`}>
                      {submittedTicket.priority}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="confirmation-subsection">
                  <h5 className="subsection-title">💬 Your Message</h5>
                  <div className="message-box">
                    <p>{submittedTicket.message}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="confirmation-subsection">
                  <h5 className="subsection-title">📊 Status</h5>
                  <div className="detail-item">
                    <span className="label">Current Status:</span>
                    <span className="value badge-value status-open">● {submittedTicket.status}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(submittedTicket.createdAt).toLocaleDateString()} at{" "}
                      {new Date(submittedTicket.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="next-steps">
                <h4>📌 What Happens Next?</h4>
                <ul>
                  <li>Your ticket has been assigned ID: <strong>{submittedTicket._id?.substring(0, 8)}...</strong></li>
                  <li>Our support team will review your request within 24 hours</li>
                  <li>You'll receive email updates at: <strong>{userDetails.email}</strong></li>
                  <li>Check back here to view responses and ticket status</li>
                </ul>
              </div>
            </div>

            <div className="confirmation-actions">
              <button className="btn-primary" onClick={handleCloseConfirmation}>
                Back to Tickets
              </button>
            </div>
          </div>
        )}

        {/* Regular tickets list - hide when showing form or confirmation */}
        {!showForm && !showConfirmation && (
          <div className="support-tickets-section">
            <h3 className="tickets-title">
              My Support Tickets
              {tickets.length > 0 && (
                <span className="ticket-count">({tickets.length})</span>
              )}
            </h3>

            {loading ? (
              <div className="support-loading">Loading your tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="support-empty">
                <span>📭</span>
                <p>No support tickets yet</p>
                <small>Submit a ticket to get help from our support team</small>
              </div>
            ) : (
              <div className="tickets-grid">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="ticket-card">
                    <div className="ticket-header">
                      <div className="ticket-subject">{ticket.subject}</div>
                      <div className="ticket-badges">
                        <span
                          className="badge status-badge"
                          style={{ backgroundColor: `${getStatusBadgeColor(ticket.status)}40` }}
                        >
                          <span style={{ color: getStatusBadgeColor(ticket.status) }}>
                            ● {ticket.status}
                          </span>
                        </span>
                        <span
                          className="badge priority-badge"
                          style={{ backgroundColor: `${getPriorityBadgeColor(ticket.priority)}40` }}
                        >
                          <span style={{ color: getPriorityBadgeColor(ticket.priority) }}>
                            ⚡ {ticket.priority}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="ticket-category">
                      Category: <strong>{ticket.category}</strong>
                    </div>

                    <div className="ticket-message">
                      <p>{ticket.message}</p>
                    </div>

                    {ticket.adminResponse && (
                      <div className="ticket-response">
                        <div className="response-label">Admin Response:</div>
                        <p>{ticket.adminResponse}</p>
                      </div>
                    )}

                    <div className="ticket-footer">
                      <div className="ticket-date">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.resolvedAt && (
                        <div className="ticket-resolved">
                          Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSupport;
