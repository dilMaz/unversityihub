import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/dashboard.css';
import '../styles/adminDashboardUnique.css';

const AdminReview = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [reviewedNotes, setReviewedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [actionId, setActionId] = useState('');
  const [viewingId, setViewingId] = useState('');
  const [topNotice, setTopNotice] = useState({ type: '', text: '' });
  const noticeTimerRef = useRef(null);

  const showTopNotice = (type, text) => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    setTopNotice({ type, text });

    noticeTimerRef.current = setTimeout(() => {
      setTopNotice({ type: '', text: '' });
      noticeTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchDashboard();
    fetchPendingNotes();
    fetchReviewedNotes();

    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, [navigate]);

  const fetchPendingNotes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notes/review/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch notes for review');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewedNotes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notes/review/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setReviewedNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch reviewed notes');
    } finally {
      setHistoryLoading(false);
    }
  };

  const approveNote = async (id) => {
    try {
      setActionId(id);
      setError('');
      await axios.put(`http://localhost:5000/api/notes/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes((prev) => prev.filter((note) => note._id !== id));
      showTopNotice('success', 'Document approved successfully');
      fetchReviewedNotes();
    } catch (err) {
      setError(err?.response?.data?.message || 'Approve failed');
    } finally {
      setActionId('');
    }
  };

  const rejectNote = async (id) => {
    try {
      setActionId(id);
      setError('');
      await axios.put(`http://localhost:5000/api/notes/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes((prev) => prev.filter((note) => note._id !== id));
      showTopNotice('reject', 'Document rejected successfully');
      fetchReviewedNotes();
    } catch (err) {
      setError(err?.response?.data?.message || 'Reject failed');
    } finally {
      setActionId('');
    }
  };

  const deleteReviewedNote = async (id) => {
    const confirmed = window.confirm('Delete this document permanently?');
    if (!confirmed) return;

    try {
      setActionId(id);
      setError('');
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setReviewedNotes((prev) => prev.filter((note) => note._id !== id));
      showTopNotice('success', 'Document deleted successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setActionId('');
    }
  };

  const getPublicFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    const normalized = fileUrl.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    return `http://localhost:5000/${normalized}`;
  };

  const viewDocument = async (id) => {
    try {
      setViewingId(id);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login again');
        navigate('/login');
        return;
      }

      const res = await axios.get(`http://localhost:5000/api/notes/${id}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const publicUrl = getPublicFileUrl(res.data?.fileUrl);
      if (!publicUrl) {
        setError('This note has no viewable file');
        return;
      }

      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to open document');
    } finally {
      setViewingId('');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  return (
    <div className="db-root admin-theme">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Document Review</div>
          <button className="db-logout" onClick={logout}>
            <span>↩</span> Sign out
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Admin Review</div>
          <h1>Review Documents <span>{name}</span></h1>
          <p>Approve or reject uploaded documents.</p>
        </div>

        {(topNotice.text || error) && (
          <div className={`review-alert ${error ? 'error' : topNotice.type}`}>
            {error || topNotice.text}
          </div>
        )}

        <div className="db-section-title">Pending Reviews ({notes.length})</div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="db-cards">
            {notes.map((note) => (
              <div key={note._id} className="db-card review-card">
                <div className="db-card-icon">📄</div>
                <div>
                  <div className="db-card-title">{note.title}</div>
                  <div className="db-card-desc">
                    {note.subject} • Uploaded by {note.uploadedBy?.name || 'Unknown'}
                  </div>
                  <div className="db-card-desc">
                    Status: {note.moderationStatus || 'pending'}
                  </div>
                </div>
                <div className="pending-actions">
                  <button
                    onClick={() => viewDocument(note._id)}
                    className="view-btn pending-view-btn"
                    disabled={viewingId === note._id || actionId === note._id}
                  >
                    {viewingId === note._id ? 'Opening...' : 'View 📄'}
                  </button>
                  <button
                    onClick={() => approveNote(note._id)}
                    className="approve-btn"
                    disabled={actionId === note._id || viewingId === note._id}
                  >
                    {actionId === note._id ? 'Working...' : 'Approve ✅'}
                  </button>
                  <button
                    onClick={() => rejectNote(note._id)}
                    className="reject-btn"
                    disabled={actionId === note._id || viewingId === note._id}
                  >
                    {actionId === note._id ? 'Working...' : 'Reject ❌'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="db-section-title">Approved & Rejected Notes ({reviewedNotes.length})</div>

        {historyLoading ? (
          <div>Loading review history...</div>
        ) : (
          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Uploaded By</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Reviewed At</th>
                  <th>View</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {reviewedNotes.length === 0 ? (
                  <tr>
                    <td colSpan="8">No approved or rejected notes yet.</td>
                  </tr>
                ) : (
                  reviewedNotes.map((note) => (
                    <tr key={note._id}>
                      <td>{note.title || '-'}</td>
                      <td>{note.subject || '-'}</td>
                      <td>{note.uploadedBy?.name || 'Unknown'}</td>
                      <td>
                        <span className={`review-status-chip ${note.moderationStatus || 'pending'}`}>
                          {(note.moderationStatus || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td>{note.reviewedBy?.name || '-'}</td>
                      <td>{formatDate(note.reviewedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="view-doc-btn"
                          onClick={() => viewDocument(note._id)}
                          disabled={viewingId === note._id || actionId === note._id}
                        >
                          {viewingId === note._id ? 'Opening...' : 'View'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-doc-btn"
                          onClick={() => deleteReviewedNote(note._id)}
                          disabled={actionId === note._id || viewingId === note._id}
                        >
                          {actionId === note._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <button className="db-admin-btn" onClick={() => navigate('/admin-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminReview;
