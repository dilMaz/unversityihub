import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/dashboard.css';

const AdminReview = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

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
  }, [navigate]);

  const fetchPendingNotes = async () => {
    try {
      // TODO: Backend endpoint for pending reviews
      const res = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes(res.data);
    } catch (err) {
      setError('Failed to fetch notes for review');
    } finally {
      setLoading(false);
    }
  };

  const approveNote = async (id) => {
    try {
      // TODO: Backend approve endpoint
      await axios.put(`http://localhost:5000/api/notes/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchPendingNotes();
    } catch (err) {
      setError('Approve failed');
    }
  };

  const rejectNote = async (id) => {
    try {
      // TODO: Backend reject endpoint
      await axios.put(`http://localhost:5000/api/notes/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchPendingNotes();
    } catch (err) {
      setError('Reject failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="db-root">
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

        <div className="db-section-title">Pending Reviews ({notes.length})</div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="db-cards">
            {notes.map((note) => (
              <div key={note._id} className="db-card review-card">
                <div className="db-card-icon">📄</div>
                <div>
                  <div className="db-card-title">{note.title}</div>
                  <div className="db-card-desc">{note.subject} - {note.downloads} downloads</div>
                </div>
                <div>
                  <button onClick={() => approveNote(note._id)} className="approve-btn">
                    Approve ✅
                  </button>
                  <button onClick={() => rejectNote(note._id)} className="reject-btn">
                    Reject ❌
                  </button>
                </div>
              </div>
            ))}
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
