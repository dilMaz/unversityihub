import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/dashboard.css';
import '../styles/adminComments.css';
import '../styles/adminDashboardUnique.css';

const renderStars = (value) => {
  const rating = Number(value) || 0;
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating)))) + '☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(rating))));
};

const getSemesterKey = (note) => {
  const semester = Number(note?.semester);
  const year = Number(note?.academicYear);
  if ([1, 2].includes(semester) && [1, 2, 3, 4].includes(year)) {
    return `Year ${year} - Semester ${semester}`;
  }
  if ([1, 2].includes(semester)) {
    return `Semester ${semester}`;
  }
  return 'Unassigned Semester';
};

const AdminComments = () => {
  const navigate = useNavigate();
  const [notesWithComments, setNotesWithComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const fetchComments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/notes/comments/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotesWithComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDeleteComment = async (noteId, commentId) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setDeletingCommentId(commentId);
      setError('');

      await axios.delete(`http://localhost:5000/api/notes/${noteId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotesWithComments((prev) =>
        prev
          .map((note) => {
            if (note._id !== noteId) return note;

            const comments = (note.comments || []).filter((comment) => comment._id !== commentId);
            return {
              ...note,
              comments,
              commentsCount: comments.length,
            };
          })
          .filter((note) => (note.commentsCount || 0) > 0)
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId('');
    }
  };

  const totalComments = notesWithComments.reduce((sum, note) => sum + (note.commentsCount || 0), 0);

  const semesterCounts = useMemo(
    () => notesWithComments.reduce((acc, note) => {
      const key = getSemesterKey(note);
      acc[key] = (acc[key] || 0) + (note.commentsCount || 0);
      return acc;
    }, {}),
    [notesWithComments]
  );

  const semesterOptions = useMemo(
    () => ['all', ...Object.keys(semesterCounts).sort((a, b) => a.localeCompare(b))],
    [semesterCounts]
  );

  const filteredNotes = useMemo(
    () => notesWithComments.filter((note) => selectedSemester === 'all' || getSemesterKey(note) === selectedSemester),
    [notesWithComments, selectedSemester]
  );

  const groupedNotes = useMemo(
    () => filteredNotes.reduce((acc, note) => {
      const key = getSemesterKey(note);
      if (!acc[key]) acc[key] = [];
      acc[key].push(note);
      return acc;
    }, {}),
    [filteredNotes]
  );

  return (
    <div className="db-root admin-theme admin-comments-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Comments</div>
          <button className="db-logout" onClick={() => navigate('/admin-dashboard')}>
            ← Back to Admin
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Comment Management</div>
          <h1>All User Comments</h1>
          <p>Comments are categorized by note so you can review feedback in one place.</p>
        </div>

        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-label">Notes With Comments</div>
            <div className="db-stat-value">{loading ? '...' : notesWithComments.length}</div>
            <span className="db-stat-accent">🗂️</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-label">Total Comments</div>
            <div className="db-stat-value">{loading ? '...' : totalComments}</div>
            <span className="db-stat-accent">💬</span>
          </div>
        </div>

        <div className="ac-semester-filter-wrap">
          <span className="ac-semester-filter-label">Filter by semester</span>
          <select
            className="ac-semester-filter"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            {semesterOptions.map((semesterKey) => (
              <option key={semesterKey} value={semesterKey}>
                {semesterKey === 'all'
                  ? `All Semesters (${totalComments})`
                  : `${semesterKey} (${semesterCounts[semesterKey] || 0})`}
              </option>
            ))}
          </select>
        </div>

        <div className="ac-semester-chips">
          {semesterOptions.map((semesterKey) => (
            <button
              key={semesterKey}
              type="button"
              className={`ac-semester-chip ${selectedSemester === semesterKey ? 'active' : ''}`}
              onClick={() => setSelectedSemester(semesterKey)}
            >
              {semesterKey === 'all' ? 'All' : semesterKey}
              <span>{semesterKey === 'all' ? totalComments : semesterCounts[semesterKey] || 0}</span>
            </button>
          ))}
        </div>

        {error && <div className="error-text">{error}</div>}

        {loading ? (
          <div className="ac-empty">Loading comments...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="ac-empty">No comments available yet.</div>
        ) : (
          <div className="ac-note-list">
            {Object.keys(groupedNotes)
              .sort((a, b) => a.localeCompare(b))
              .map((semesterKey) => (
                <section key={semesterKey} className="ac-semester-group">
                  <div className="ac-semester-title">
                    {semesterKey}
                    <span>{semesterCounts[semesterKey] || 0} comments</span>
                  </div>

                  {groupedNotes[semesterKey].map((note) => (
                    <div key={note._id} className="ac-note-card">
                      <div className="ac-note-head">
                        <div>
                          <h3>{note.title}</h3>
                          <p>
                            {note.subject}
                            {note.moduleCode ? ` • ${note.moduleCode}` : ''}
                          </p>
                        </div>
                        <div className="ac-note-meta">
                          <span>{note.commentsCount} comments</span>
                          <span>{Number(note.averageRating || 0).toFixed(1)} / 5</span>
                        </div>
                      </div>

                      <div className="ac-comment-table-wrap">
                        <table className="user-table ac-comment-table">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Rating</th>
                              <th>Comment</th>
                              <th>Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {note.comments.map((comment) => (
                              <tr key={comment._id}>
                                <td>
                                  <div className="ac-user-cell">
                                    <strong>{comment.user?.name || 'Unknown User'}</strong>
                                    <small>{comment.user?.email || '-'}</small>
                                  </div>
                                </td>
                                <td>
                                  <span className="ac-rating">{renderStars(comment.rating)}</span>
                                </td>
                                <td className="ac-comment-text">{comment.text}</td>
                                <td>{new Date(comment.createdAt).toLocaleString()}</td>
                                <td className="ac-action-cell">
                                  <button
                                    type="button"
                                    className="db-danger-btn"
                                    onClick={() => handleDeleteComment(note._id, comment._id)}
                                    disabled={deletingCommentId === comment._id}
                                  >
                                    {deletingCommentId === comment._id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComments;
