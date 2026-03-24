import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import NoteComments from "../components/NoteComments";
import "../styles/TopRated.css";

function TopRated() {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedCommentsNote, setExpandedCommentsNote] = useState(null);
  const [error, setError]         = useState(null);

  const renderRating = useCallback((note) => {
    const avg = Number(note?.averageRating || 0);
    const rounded = Math.round(avg);
    const stars = `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
    return `${stars} ${avg.toFixed(1)} (${note?.ratingCount || 0})`;
  }, []);

  const getPublicFileUrl = useCallback((fileUrl) => {
    if (!fileUrl) return null;
    const normalized = fileUrl.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    return `http://localhost:5000/${normalized}`;
  }, []);

  const forceBrowserDownload = useCallback(async (publicUrl, title) => {
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch file for download");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = title || "note-file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }, []);

  // 🔥 Fetch Top Notes with Error Handling
  const fetchTopNotes = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get("http://localhost:5000/api/notes/top", {
        timeout: 10000, // 10 second timeout
      });
      setNotes(res.data);
    } catch (err) {
      let errorMessage = "Failed to load top notes";

      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please try again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Notes not found (404)";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Check your connection.";
      }

      setError(errorMessage);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopNotes();
  }, [fetchTopNotes]);

  // 📥 Download with Token Validation
  const handleDownload = useCallback(async (id, title) => {
    const token = localStorage.getItem("token");

    // Token validation
    if (!token) {
      setError("Please log in to download notes");
      return;
    }

    setDownloading(id);
    setError(null);

    try {
      const response = await axios.put(
        `http://localhost:5000/api/notes/${id}/download`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      const publicUrl = getPublicFileUrl(response.data?.fileUrl);
      if (publicUrl) {
        await forceBrowserDownload(publicUrl, title);
      } else {
        setError("This note file is missing on server. Please re-upload it.");
      }

      // Refresh notes after successful download
      await fetchTopNotes();
    } catch (err) {
      let errorMessage = "Download failed";

      if (err.code === "ECONNABORTED") {
        errorMessage = "Download request timed out";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        localStorage.removeItem("token");
      } else if (err.response?.status === 404) {
        errorMessage = err.response?.data?.message || "Note not found";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Try again later.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Check your connection.";
      }

      setError(errorMessage);
    } finally {
      setDownloading(null);
    }
  }, [fetchTopNotes, forceBrowserDownload, getPublicFileUrl]);

  const handleViewOnline = useCallback(async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view notes");
      return;
    }

    setViewing(id);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/notes/${id}/view`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      const publicUrl = getPublicFileUrl(response.data?.fileUrl);
      if (publicUrl) {
        window.open(publicUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("This note file is missing on server. Please re-upload it.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open note online");
    } finally {
      setViewing(null);
    }
  }, [getPublicFileUrl]);

  return (
    <div className="tr-root">
      <div className="tr-wrap">

        {/* Header */}
        <div className="tr-header">
          <div className="tr-label">Rankings</div>
          <h1>Top <span>Rated</span> Notes</h1>
          <p>The most downloaded and highest rated notes by students.</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="tr-error-banner">
            <span>⚠️</span>
            <div>
              <p>{error}</p>
              {error.includes("timed out") || error.includes("Network") ? (
                <button onClick={() => fetchTopNotes()} className="tr-retry-btn">
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="tr-loading">
            {[1, 2, 3].map((i) => (
              <div className="tr-skeleton-card" key={i}>
                <div className="sk sk-rank" />
                <div className="sk sk-title" />
                <div className="sk sk-sub" />
                <div className="sk sk-btn" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && notes.length === 0 && !error && (
          <div className="tr-empty">
            <span>📭</span>
            <p>No top notes found yet.</p>
            <small>Be the first to share and get rated!</small>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && notes.length > 0 && (
          <div className="tr-grid">
            {notes.map((note, index) => (
              <div key={note._id}>
                <div
                  className={`tr-card ${index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : ""}`}
                >
                  <div className="tr-card-glow" />

                  {/* Rank badge */}
                  <div className="tr-rank">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>

                  {/* Icon */}
                  <div className="tr-note-icon">📄</div>

                  {/* Info */}
                  <div className="tr-note-info">
                    <h3 className="tr-note-title">{note.title}</h3>
                    <span className="tr-note-subject">📚 {note.subject}</span>
                    <span className="tr-note-rating">⭐ {renderRating(note)}</span>
                    <span className="tr-note-downloads">📥 {note.downloads} downloads</span>
                  </div>

                  {/* Download */}
                  <div className="tr-note-actions">
                    <button
                      className="tr-view-btn"
                      onClick={() => handleViewOnline(note._id)}
                      disabled={viewing === note._id}
                      title={viewing === note._id ? "Opening..." : "View note online"}
                    >
                      {viewing === note._id ? "Opening..." : "View 👀"}
                    </button>

                    <button
                      className="tr-download-btn"
                      onClick={() => handleDownload(note._id, note.title)}
                      disabled={downloading === note._id}
                      title={downloading === note._id ? "Downloading..." : "Download note"}
                    >
                      {downloading === note._id
                        ? <><span className="tr-spinner" /> Downloading...</>
                        : <>Download 📥</>
                      }
                    </button>

                    <button
                      className="tr-quiz-btn"
                      onClick={() => setExpandedNote(expandedNote === note._id ? null : note._id)}
                      title={expandedNote === note._id ? "Hide quiz" : "Generate AI quiz"}
                    >
                      {expandedNote === note._id ? "Hide ▼" : "Quiz 📝"}
                    </button>

                    <button
                      className="tr-comments-btn"
                      onClick={() =>
                        setExpandedCommentsNote(
                          expandedCommentsNote === note._id ? null : note._id
                        )
                      }
                      title={expandedCommentsNote === note._id ? "Hide comments" : "Show comments"}
                    >
                      {expandedCommentsNote === note._id ? "Hide 💬" : "Comments 💬"}
                    </button>
                  </div>
                </div>

                {/* Quiz Section */}
                {expandedNote === note._id && (
                  <div className="tr-quiz-container">
                    <QuizSection noteId={note._id} />
                  </div>
                )}

                {expandedCommentsNote === note._id && (
                  <div className="tr-comments-container">
                    <NoteComments noteId={note._id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      <style jsx>{`
        .tr-note-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .tr-view-btn,
        .tr-comments-btn {
          padding: 10px 16px;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tr-view-btn {
          background: linear-gradient(135deg, #6d5efc 0%, #8f7cff 100%);
        }

        .tr-comments-btn {
          background: linear-gradient(135deg, #d86bff 0%, #f187ff 100%);
        }

        .tr-view-btn:hover,
        .tr-comments-btn:hover {
          transform: translateY(-2px);
        }

        .tr-view-btn:disabled,
        .tr-comments-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tr-quiz-btn {
          flex: 1;
          padding: 10px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tr-quiz-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .tr-quiz-container {
          margin-top: -10px;
          padding: 0 16px 16px 16px;
        }

        .tr-comments-container {
          margin-top: -10px;
          padding: 0 16px 16px 16px;
        }
      `}</style>
    </div>
  );
}

export default TopRated;