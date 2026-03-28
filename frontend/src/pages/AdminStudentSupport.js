import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/adminSupport.css";

function AdminStudentSupport() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [status, setStatus] = useState("pending");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchRequests();
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/support/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch support requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setReplyText(request.adminReply || "");
    setStatus(request.status || "pending");
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5000/api/support/admin/${selectedRequest._id}`,
        {
          adminReply: replyText,
          status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update the request in the list
      setRequests(prev => 
        prev.map(req => 
          req._id === selectedRequest._id ? res.data : req
        )
      );

      // Update selected request
      setSelectedRequest(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update request");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ff9800";
      case "in_progress": return "#2196f3";
      case "resolved": return "#4caf50";
      default: return "#666";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "#4caf50";
      case "medium": return "#ff9800";
      case "high": return "#f44336";
      default: return "#666";
    }
  };

  const goBack = () => {
    navigate("/admin-dashboard");
  };

  if (loading) {
    return (
      <div className="admin-support-loading">
        <div className="loading-spinner"></div>
        <p>Loading support requests...</p>
      </div>
    );
  }

  return (
    <div className="admin-support-container">
      <div className="admin-support-header">
        <button className="back-btn" onClick={goBack}>
          ← Back to Admin Dashboard
        </button>
        <h1>Student Support Management</h1>
        <p>View and respond to student support requests</p>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <div className="admin-support-content">
        <div className="requests-list">
          <h2>Support Requests ({requests.length})</h2>
          {requests.length === 0 ? (
            <div className="no-requests">
              <p>No support requests yet.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className={`request-card ${selectedRequest?._id === request._id ? "selected" : ""}`}
                  onClick={() => handleRequestClick(request)}
                >
                  <div className="request-header">
                    <h3>{request.title}</h3>
                    <div className="request-meta">
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(request.priority) }}
                      >
                        {request.priority}
                      </span>
                    </div>
                  </div>
                  <div className="request-category">
                    <strong>Category:</strong> {request.category}
                  </div>
                  <div className="request-student">
                    <strong>From:</strong> {request.student?.name || 'Unknown'} ({request.student?.email})
                  </div>
                  <div className="request-date">
                    <strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                  <div className="request-preview">
                    {request.description.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedRequest && (
          <div className="request-detail">
            <div className="detail-header">
              <h2>{selectedRequest.title}</h2>
              <div className="detail-meta">
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                >
                  {selectedRequest.status.replace('_', ' ')}
                </span>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(selectedRequest.priority) }}
                >
                  {selectedRequest.priority}
                </span>
              </div>
            </div>

            <div className="detail-info">
              <div className="info-row">
                <strong>Category:</strong> {selectedRequest.category}
              </div>
              <div className="info-row">
                <strong>From:</strong> {selectedRequest.student?.name || 'Unknown'}
              </div>
              <div className="info-row">
                <strong>Email:</strong> {selectedRequest.student?.email}
              </div>
              <div className="info-row">
                <strong>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="detail-description">
              <h3>Issue Description</h3>
              <p>{selectedRequest.description}</p>
            </div>

            <div className="admin-reply-section">
              <h3>Admin Response</h3>
              <div className="reply-form">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reply">Reply to Student</label>
                  <textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter your response to the student..."
                    rows={6}
                    className="reply-textarea"
                  />
                </div>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="update-btn"
                >
                  {updating ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Updating...
                    </span>
                  ) : (
                    "Update Response"
                  )}
                </button>
              </div>

              {selectedRequest.adminReply && (
                <div className="current-reply">
                  <h4>Current Response:</h4>
                  <p>{selectedRequest.adminReply}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStudentSupport;
