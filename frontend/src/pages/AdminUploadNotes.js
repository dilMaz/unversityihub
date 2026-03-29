import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminFooter from '../components/AdminFooter';
import "../styles/dashboard.css"; // reuse dashboard styles
import "../styles/adminDashboardUnique.css";

const AdminUploadNotes = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleBack = () => {
    navigate('/admin-dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subject || !file) {
      setError('Please fill all fields and select a file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('noteFile', file);

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post('http://localhost:5000/api/notes/admin-upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(res.data.message);
      setTitle('');
      setSubject('');
      setFile(null);
      setPreviewUrl('');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="db-root admin-theme">
      <div className="db-wrap">
        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-logo">Admin Upload Notes</div>
          <div className="db-topbar-actions">
            <button className="db-admin-btn" onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="db-hero">
          <h1>Upload New Notes</h1>
          <p>Add new study materials to the platform.</p>
        </div>

        {/* Upload Form */}
        <div className="db-section-title">Upload Form</div>
        <form className="db-card" onSubmit={handleSubmit}>
          {error && <div className="db-error">{error}</div>}
          {message && <div className="db-success">{message}</div>}

          <div className="db-form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Java Notes"
              required
            />
          </div>

          <div className="db-form-group">
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Programming"
              required
            />
          </div>

          <div className="db-form-group">
            <label>Note File (PDF, DOC, etc.)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              required
            />
          </div>

          {previewUrl && (
            <div className="db-preview">
              <label>Preview:</label>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="db-preview-link">
                {file.name}
              </a>
            </div>
          )}

          <button type="submit" className="db-card-btn-full" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Note 📤'}
          </button>
        </form>

        <style jsx>{`
          .db-error { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
          .db-success { color: #10b981; background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
          .db-form-group { margin-bottom: 20px; }
          .db-form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
          .db-form-group input, .db-form-group input[type="file"] { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; }
          .db-preview { background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
          .db-preview-link { color: #3b82f6; text-decoration: none; font-weight: 500; }
          .db-card-btn-full { width: 100%; }
        `}</style>
      </div>
      <AdminFooter />
    </div>
  );
};

export default AdminUploadNotes;

