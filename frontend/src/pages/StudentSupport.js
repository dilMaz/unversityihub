import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/adminSupport.css';

const StudentSupport = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("open");
  const [replying, setReplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const token = localStorage.getItem("token");

  // Fetch all tickets
  useEffect(() => {
    fetchAllTickets();
  }, []);

  const fetchAllTickets = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get("http://localhost:5000/api/support/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/support/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedTicket(res.data);
      setTicketStatus(res.data.status);
      setReplyText("");
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load ticket details");
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      setError("Please enter a response");
      return;
    }

    setReplying(true);
    setError("");

    try {
      await axios.put(
        `http://localhost:5000/api/support/${selectedTicket._id}`,
        {
          status: ticketStatus,
          adminResponse: replyText.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage("Reply sent successfully!");
      setReplyText("");
      await fetchAllTickets();
      setShowModal(false);

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
    setReplyText("");
    setError("");
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "#ffc107",
      "in-progress": "#2196f3",
      resolved: "#4caf50",
      closed: "#9e9e9e",
    };
    return colors[status] || "#999";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#4caf50",
      medium: "#2196f3",
      high: "#f44336",
    };
    return colors[priority] || "#999";
  };

  const getCategoryBadge = (category) => {
    const badges = {
      technical: "🔧",
      content: "📚",
      account: "👤",
      billing: "💳",
      other: "📌",
    };
    return badges[category] || "📌";
  };

  return (
    <div className="admin-support-root">
      <div className="admin-support-container">
        <div className="support-topbar">
          <div className="support-logo">👨‍💼 Admin Support Management</div>
          <button className="back-btn" onClick={() => navigate("/admin-dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="support-hero">
          <h1>Student Support Tickets</h1>
          <p>View and manage all student support requests</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <span>✓</span>
            {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="ticket-stats">
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div>
              <div className="stat-number">{tickets.length}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔴</span>
            <div>
              <div className="stat-number">{tickets.filter(t => t.status === "open").length}</div>
              <div className="stat-label">Open</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🟡</span>
            <div>
              <div className="stat-number">{tickets.filter(t => t.status === "in-progress").length}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div>
              <div className="stat-number">{tickets.filter(t => t.status === "resolved").length}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="tickets-table-section">
          <h3 className="section-title">All Support Tickets</h3>

          {loading ? (
            <div className="loading">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No support tickets yet</p>
            </div>
          ) : (
            <div className="tickets-table-wrapper">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>
                        <div className="student-info">
                          <div className="student-name">{ticket.studentName}</div>
                          <div className="student-email">{ticket.studentEmail}</div>
                        </div>
                      </td>
                      <td>
                        <div className="subject-info">
                          <div className="subject-text">{ticket.subject}</div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">{getCategoryBadge(ticket.category)} {ticket.category}</span>
                      </td>
                      <td>
                        <span
                          className="priority-badge"
                          style={{
                            backgroundColor: `${getPriorityColor(ticket.priority)}30`,
                            color: getPriorityColor(ticket.priority),
                          }}
                        >
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(ticket.status)}30`,
                            color: getStatusColor(ticket.status),
                          }}
                        >
                          ● {ticket.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleViewTicket(ticket._id)}
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {showModal && selectedTicket && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Ticket Details & Reply</h2>
                <button className="close-btn" onClick={closeModal}>✕</button>
              </div>

              <div className="modal-body">
                {/* Ticket Info */}
                <div className="ticket-detail-card">
                  <h4 className="card-title">📋 Ticket Information</h4>

                  <div className="detail-row">
                    <span className="detail-label">Ticket ID:</span>
                    <span className="detail-value">{selectedTicket._id?.substring(0, 12)}...</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Student:</span>
                    <div>
                      <div className="detail-value">{selectedTicket.studentName}</div>
                      <div className="detail-value-secondary">{selectedTicket.studentEmail}</div>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Subject:</span>
                    <span className="detail-value">{selectedTicket.subject}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{selectedTicket.category}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Priority:</span>
                    <span
                      className="detail-value"
                      style={{ color: getPriorityColor(selectedTicket.priority) }}
                    >
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Student Message */}
                <div className="ticket-detail-card">
                  <h4 className="card-title">💬 Student Message</h4>
                  <div className="message-box">
                    <p>{selectedTicket.message}</p>
                  </div>
                </div>

                {/* Admin Response (if exists) */}
                {selectedTicket.adminResponse && (
                  <div className="ticket-detail-card response-card">
                    <h4 className="card-title">📨 Your Response</h4>
                    <div className="response-box">
                      <p>{selectedTicket.adminResponse}</p>
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                <div className="ticket-detail-card">
                  <h4 className="card-title">✍️ Send Response</h4>

                  <div className="form-group">
                    <label>Update Status</label>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      className="status-select"
                    >
                      <option value="open" style={{ background: '#131320', color: '#f0eeff' }}>Open</option>
                      <option value="in-progress" style={{ background: '#131320', color: '#f0eeff' }}>In Progress</option>
                      <option value="resolved" style={{ background: '#131320', color: '#f0eeff' }}>Resolved</option>
                      <option value="closed" style={{ background: '#131320', color: '#f0eeff' }}>Closed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Response Message</label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to the student..."
                      maxLength="2000"
                      rows="6"
                      className="reply-textarea"
                    />
                    <small className="char-count">{replyText.length}/2000</small>
                  </div>

                  <button
                    className="submit-reply-btn"
                    onClick={handleSubmitReply}
                    disabled={replying}
                  >
                    {replying ? "Sending..." : "Send Response"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSupport;
