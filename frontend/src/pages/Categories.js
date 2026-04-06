import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import NoteComments from "../components/NoteComments";
import "../styles/categories.css";

function Categories() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedCommentsNote, setExpandedCommentsNote] = useState(null);

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

  const fetchNotes = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get("http://localhost:5000/api/notes", {
        timeout: 10000,
      });
      const allNotes = Array.isArray(res.data) ? res.data : [];
      setNotes(allNotes);

      const dynamicModules = [
        ...new Set(
          allNotes
            .map((note) => (note.moduleName || note.moduleCode || "").trim())
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b));

      setModules(["All", ...dynamicModules]);
      setSelectedModule("All");
    } catch (err) {
      let errorMessage = "Failed to load notes";

      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please try again.";
      } else if (err.response?.status === 404) {
        errorMessage = "No notes found";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Check your connection.";
      }

      setError(errorMessage);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Filter notes by module, year, semester, and approval status
  useEffect(() => {
    let filtered = notes;

    // Filter by approval status (show only approved or legacy notes)
    filtered = filtered.filter((note) => note.moderationStatus === "approved" || !note.moderationStatus);

    // Filter by module
    if (selectedModule !== "All") {
      filtered = filtered.filter((note) => (note.moduleName || note.moduleCode) === selectedModule);
    }

    // Filter by academic year
    if (selectedYear !== "All") {
      filtered = filtered.filter((note) => note.academicYear === parseInt(selectedYear));
    }

    // Filter by semester
    if (selectedSemester !== "All") {
      filtered = filtered.filter((note) => note.semester === parseInt(selectedSemester));
    }

    setFilteredNotes(filtered);
  }, [selectedModule, selectedYear, selectedSemester, notes]);

  // Download handler
  const handleDownload = useCallback(async (id, title) => {
    const token = localStorage.getItem("token");

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

      await fetchNotes();
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
  }, [fetchNotes, forceBrowserDownload, getPublicFileUrl]);

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
      const errorMessage = err.response?.data?.message || "Failed to open note";
      setError(errorMessage);
    } finally {
      setViewing(null);
    }
  }, [getPublicFileUrl]);

  return (
    <div className="categories-root">
      <div className="cat-wrap">
        {/* Header */}
        <div className="cat-header">
          <div className="cat-label">📚 Modules</div>
          <h1>Browse by <span>Module</span></h1>
          <p>Explore approved notes organized by module</p>
        </div>

        {/* Error */}
        {error && (
          <div className="cat-error-banner">
            <span>⚠️</span>
            <div>
              <p>{error}</p>
              {error.includes("timed out") || error.includes("Network") ? (
                <button onClick={fetchNotes} className="cat-retry-btn">
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Year & Semester Filter - PRIMARY */}
        {!loading && (
          <div className="filters-section">
            <div className="filter-group">
              <h3 className="filter-title">📅 Select Academic Year</h3>
              <div className="category-buttons">
                <button
                  className={`cat-btn ${selectedYear === "All" ? "active" : ""}`}
                  onClick={() => setSelectedYear("All")}
                >
                  All Years
                </button>
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    className={`cat-btn ${selectedYear === year.toString() ? "active" : ""}`}
                    onClick={() => setSelectedYear(year.toString())}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3 className="filter-title">🔢 Select Semester</h3>
              <div className="category-buttons">
                <button
                  className={`cat-btn ${selectedSemester === "All" ? "active" : ""}`}
                  onClick={() => setSelectedSemester("All")}
                >
                  All Semesters
                </button>
                {[1, 2].map((sem) => (
                  <button
                    key={sem}
                    className={`cat-btn ${selectedSemester === sem.toString() ? "active" : ""}`}
                    onClick={() => setSelectedSemester(sem.toString())}
                  >
                    Semester {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Display */}
        {!loading && (selectedYear !== "All" || selectedSemester !== "All" || selectedModule !== "All") && (
          <div className="active-filter-display">
            <span className="filter-badge">
              {selectedModule !== "All" ? `Module: ${selectedModule}` : "All Modules"}
              {" • "}
              {selectedYear !== "All" ? `Year ${selectedYear}` : "All Years"}
              {" • "}
              {selectedSemester !== "All" ? `Semester ${selectedSemester}` : "All Semesters"}
            </span>
          </div>
        )}

        {/* Module Filter - SECONDARY */}
        {!loading && (
          <div className="categories-filter">
            <h3 className="filter-title">📚 Filter by Module</h3>
            <div className="category-buttons">
              {modules.map((mod) => (
                <button
                  key={mod}
                  className={`cat-btn ${selectedModule === mod ? "active" : ""}`}
                  onClick={() => setSelectedModule(mod)}
                >
                  {mod === "All" && "📂"}
                  {mod !== "All" && "📖"}
                  {` ${mod}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="cat-loading">
            {[1, 2, 3, 4].map((i) => (
              <div className="cat-skeleton-card" key={i}>
                <div className="sk sk-header" />
                <div className="sk sk-text" />
                <div className="sk sk-text-small" />
                <div className="sk sk-button" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotes.length === 0 && !error && (
          <div className="cat-empty">
            <span>📭</span>
            <p>No approved notes found in this module</p>
            <small>Check back soon for more content</small>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && filteredNotes.length > 0 && (
          <div className="cat-grid">
            {filteredNotes.map((note) => (
              <div key={note._id} className="cat-card-wrapper">
                <div className="cat-card">
                  <div className="cat-card-header">
                    <div className="cat-icon">📄</div>
                    <div className="cat-badge">{note.moduleName || note.moduleCode || "General"}</div>
                  </div>

                  <div className="cat-card-content">
                    <h3 className="cat-title">{note.title}</h3>
                    <div className="cat-meta">
                      <span className="cat-subject">📚 {note.subject}</span>
                      <span className="cat-downloads">📥 {note.downloads}</span>
                      <span className="cat-year">📅 Year {note.academicYear}</span>
                      <span className="cat-semester">🔢 Sem {note.semester}</span>
                    </div>

                    {note.description && (
                      <p className="cat-description">{note.description}</p>
                    )}
                  </div>

                  <div className="cat-actions">
                    <button
                      className="cat-view-btn"
                      onClick={() => handleViewOnline(note._id)}
                      disabled={viewing === note._id}
                      title="View note online"
                    >
                      {viewing === note._id ? "Opening..." : "👀 View"}
                    </button>

                    <button
                      className="cat-download-btn"
                      onClick={() => handleDownload(note._id, note.title)}
                      disabled={downloading === note._id}
                      title="Download note"
                    >
                      {downloading === note._id ? (
                        <>
                          <span className="cat-spinner" /> Downloading
                        </>
                      ) : (
                        <>📥 Download</>
                      )}
                    </button>

                    <button
                      className="cat-quiz-btn"
                      onClick={() =>
                        setExpandedNote(
                          expandedNote === note._id ? null : note._id
                        )
                      }
                      title="Generate quiz"
                    >
                      {expandedNote === note._id ? "Hide ▼" : "📝 Quiz"}
                    </button>

                    <button
                      className="cat-comments-btn"
                      onClick={() =>
                        setExpandedCommentsNote(
                          expandedCommentsNote === note._id ? null : note._id
                        )
                      }
                      title="Show comments"
                    >
                      {expandedCommentsNote === note._id ? "Hide 💬" : "💬 Comments"}
                    </button>
                  </div>
                </div>

                {/* Quiz Section */}
                {expandedNote === note._id && (
                  <div className="cat-quiz-container">
                    <QuizSection noteId={note._id} />
                  </div>
                )}

                {expandedCommentsNote === note._id && (
                  <div className="cat-comments-container">
                    <NoteComments noteId={note._id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && notes.length > 0 && (
          <div className="cat-stats">
            <div className="stat-item">
              <span className="stat-icon">📚</span>
              <div>
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">Total Notes</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📚</span>
              <div>
                <div className="stat-value">
                  {new Set(notes.map((n) => n.subject)).size}
                </div>
                <div className="stat-label">Subjects</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">�</span>
              <div>
                <div className="stat-value">{modules.length - 1}</div>
                <div className="stat-label">Modules</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📥</span>
              <div>
                <div className="stat-value">
                  {notes.reduce((sum, n) => sum + (n.downloads || 0), 0)}
                </div>
                <div className="stat-label">Downloads</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Categories;
