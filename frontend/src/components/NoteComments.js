import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/noteComments.css";

function NoteComments({ noteId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || null;
    } catch (_err) {
      return null;
    }
  };

  const isOwnComment = (comment) => {
    const currentUserId = getCurrentUserId();
    const commentUserId = comment?.user?._id || comment?.user?.id || comment?.user;
    if (!currentUserId || !commentUserId) return false;
    return String(currentUserId) === String(commentUserId);
  };

  const fetchComments = async () => {
    const token = localStorage.getItem("token");
    if (!token || !noteId) return;

    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:5000/api/notes/${noteId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!text.trim()) {
      setError("Please write a comment");
      return;
    }

    if (!token) {
      setError("Please log in to comment");
      return;
    }

    setPosting(true);
    setError("");

    try {
      await axios.post(
        `http://localhost:5000/api/notes/${noteId}/comments`,
        { rating, text: text.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setText("");
      await fetchComments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text || "");
    setEditRating(Number(comment.rating) || 3);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditText("");
    setEditRating(5);
  };

  const handleUpdate = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to edit comments");
      return;
    }

    if (!editText.trim()) {
      setError("Please write a comment");
      return;
    }

    setUpdatingId(commentId);
    setError("");
    try {
      await axios.put(
        `http://localhost:5000/api/notes/${noteId}/comments/${commentId}`,
        { text: editText.trim(), rating: editRating },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      cancelEdit();
      await fetchComments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update comment");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to delete comments");
      return;
    }

    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    setDeletingId(commentId);
    setError("");
    try {
      await axios.delete(
        `http://localhost:5000/api/notes/${noteId}/comments/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (editingId === commentId) {
        cancelEdit();
      }
      await fetchComments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="note-comments">
      <h4 className="note-comments-title">Comments ({comments.length})</h4>

      <form className="note-comment-form" onSubmit={handleSubmit}>
        <div className="note-rating-picker" aria-label="Select star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= rating ? "active" : ""}`}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              title={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
          <span className="selected-rating">{rating}/5</span>
        </div>

        <textarea
          className="note-comment-input"
          placeholder="Share your feedback about this note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div className="note-comment-row">
          <small>{text.length}/500</small>
          <button type="submit" className="post-comment-btn" disabled={posting}>
            {posting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {error && <div className="note-comment-error">{error}</div>}

      {loading ? <p className="note-comments-loading">Loading comments...</p> : null}

      {!loading && comments.length === 0 ? (
        <p className="note-comments-empty">No comments yet. Be the first one.</p>
      ) : null}

      <div className="note-comments-list">
        {comments.map((comment) => (
          <div key={comment._id} className="note-comment-item">
            <div className="note-comment-head">
              <span className="note-comment-user">{comment.user?.name || "Student"}</span>
              <span className="note-comment-rating">{"★".repeat(comment.rating || 3)}{"☆".repeat(5 - (comment.rating || 3))}</span>
            </div>

            {editingId === comment._id ? (
              <div className="note-comment-edit-box">
                <div className="note-rating-picker" aria-label="Edit star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= editRating ? "active" : ""}`}
                      onClick={() => setEditRating(star)}
                      title={`${star} star${star > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="selected-rating">{editRating}/5</span>
                </div>

                <textarea
                  className="note-comment-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={500}
                  rows={3}
                />

                <div className="note-comment-actions-row">
                  <button
                    type="button"
                    className="note-comment-action-btn primary"
                    onClick={() => handleUpdate(comment._id)}
                    disabled={updatingId === comment._id}
                  >
                    {updatingId === comment._id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="note-comment-action-btn"
                    onClick={cancelEdit}
                    disabled={updatingId === comment._id}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="note-comment-text">{comment.text}</p>
            )}

            {isOwnComment(comment) ? (
              <div className="note-comment-owner-actions">
                <button
                  type="button"
                  className="note-comment-action-btn"
                  onClick={() => startEdit(comment)}
                  disabled={deletingId === comment._id || updatingId === comment._id}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="note-comment-action-btn danger"
                  onClick={() => handleDelete(comment._id)}
                  disabled={deletingId === comment._id || updatingId === comment._id}
                >
                  {deletingId === comment._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoteComments;
