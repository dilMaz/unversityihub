import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import NoteComments from "../components/NoteComments";
import { API_BASE_URL } from "../config/appConfig";
import "../styles/TopRated.css";

function TopRated() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedCommentsNote, setExpandedCommentsNote] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("downloads");

  const API_ROOT = API_BASE_URL.replace(/\/+$/, "");

  const getPublicFileUrl = useCallback((fileUrl) => {
    if (!fileUrl) return null;
    const normalized = fileUrl.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    return `${API_ROOT}/${normalized}`;
  }, [API_ROOT]);

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

  // Fetch top notes with error handling
  const fetchTopNotes = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get(`${API_ROOT}/api/notes/top`, {
        timeout: 10000, // 10 second timeout
      });
      setNotes(Array.isArray(res.data) ? res.data : []);
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
  }, [API_ROOT]);

  useEffect(() => {
    fetchTopNotes();
  }, [fetchTopNotes]);

  // Download with token validation
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
        `${API_ROOT}/api/notes/${id}/download`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setNotes((prev) =>
        prev.map((note) =>
          note._id === id
            ? { ...note, downloads: response.data?.downloads ?? (note.downloads || 0) + 1 }
            : note
        )
      );

      const publicUrl = getPublicFileUrl(response.data?.fileUrl);
      if (!publicUrl) {
        setError("This note has no downloadable file");
        return;
      }

      const fileNameFromUrl = decodeURIComponent(publicUrl.split("?")[0].split("/").pop() || "");
      const safeTitle = String(title || "note-file").trim() || "note-file";
      const downloadName = fileNameFromUrl || safeTitle;
      await forceBrowserDownload(publicUrl, downloadName);
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
  }, [API_ROOT, forceBrowserDownload, getPublicFileUrl]);

  const availableYears = useMemo(
    () => [...new Set(notes.map((n) => n.academicYear).filter(Boolean))].sort((a, b) => a - b),
    [notes]
  );

  const availableSemesters = useMemo(
    () => [...new Set(notes.map((n) => n.semester).filter(Boolean))].sort((a, b) => a - b),
    [notes]
  );

  const availableCategories = useMemo(
    () => [...new Set(notes.map((n) => n.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = notes.filter((note) => {
      const matchesQuery =
        !q ||
        (note.title || "").toLowerCase().includes(q) ||
        (note.subject || "").toLowerCase().includes(q) ||
        (note.moduleCode || "").toLowerCase().includes(q);

      const matchesYear = selectedYear === "All" || note.academicYear === Number(selectedYear);
      const matchesSemester = selectedSemester === "All" || note.semester === Number(selectedSemester);
      const matchesCategory = selectedCategory === "All" || note.category === selectedCategory;

      return matchesQuery && matchesYear && matchesSemester && matchesCategory;
    });

    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "title":
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "downloads":
      default:
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
    }

    return filtered;
  }, [notes, query, selectedYear, selectedSemester, selectedCategory, sortBy]);

  const topStats = useMemo(() => {
    const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
    const uniqueSubjects = new Set(notes.map((n) => n.subject).filter(Boolean)).size;
    const topNote = [...notes].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];

    return {
      totalDownloads,
      uniqueSubjects,
      topNoteTitle: topNote?.title || "-",
    };
  }, [notes]);

  const hasActiveFilters =
    query.trim() || selectedYear !== "All" || selectedSemester !== "All" || selectedCategory !== "All" || sortBy !== "downloads";

  const clearFilters = () => {
    setQuery("");
    setSelectedYear("All");
    setSelectedSemester("All");
    setSelectedCategory("All");
    setSortBy("downloads");
  };

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

        {!loading && !error && notes.length > 0 && (
          <div className="tr-stats">
            <div className="tr-stat-card">
              <span className="tr-stat-label">Total Downloads</span>
              <strong>{topStats.totalDownloads}</strong>
            </div>
            <div className="tr-stat-card">
              <span className="tr-stat-label">Subjects</span>
              <strong>{topStats.uniqueSubjects}</strong>
            </div>
            <div className="tr-stat-card tr-wide">
              <span className="tr-stat-label">Top Note</span>
              <strong>{topStats.topNoteTitle}</strong>
            </div>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="tr-controls">
            <div className="tr-search-bar">
              <span>Search</span>
              <input
                type="text"
                placeholder="Search in top-rated notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="tr-filter-grid">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="All">All Years</option>
                {availableYears.map((year) => (
                  <option value={String(year)} key={year}>
                    Year {year}
                  </option>
                ))}
              </select>

              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="All">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option value={String(sem)} key={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>

              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {availableCategories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="downloads">Most Downloaded</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            {hasActiveFilters ? (
              <button className="tr-clear-filters" onClick={clearFilters} type="button">
                Reset View
              </button>
            ) : null}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="tr-error-banner">
            <span>Warning</span>
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
        {!loading && filteredNotes.length === 0 && !error && (
          <div className="tr-empty">
            <span>No Results</span>
            <p>No matching notes found.</p>
            <small>Try changing filters or search terms.</small>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && filteredNotes.length > 0 && (
          <>
            <div className="tr-results-summary">
              Showing {filteredNotes.length} result{filteredNotes.length !== 1 ? "s" : ""}
            </div>
            <div className="tr-grid">
            {filteredNotes.map((note, index) => (
              <div key={note._id}>
                <div
                  className={`tr-card ${index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : ""}`}
                >
                  <div className="tr-card-glow" />

                  {/* Rank badge */}
                  <div className="tr-rank">
                    {index === 0 ? "#1" : index === 1 ? "#2" : index === 2 ? "#3" : `#${index + 1}`}
                  </div>

                  {/* Icon */}
                  <div className="tr-note-icon">N</div>

                  {/* Info */}
                  <div className="tr-note-info">
                    <h3 className="tr-note-title">{note.title}</h3>
                    <span className="tr-note-subject">Subject: {note.subject}</span>
                    {note.academicYear ? <span className="tr-note-meta">Year {note.academicYear}</span> : null}
                    {note.semester ? <span className="tr-note-meta">Sem {note.semester}</span> : null}
                    {note.category ? <span className="tr-note-meta">Category: {note.category}</span> : null}
                    <span className="tr-note-downloads">Downloads: {note.downloads}</span>
                  </div>

                  {/* Download */}
                  <div className="tr-note-actions">
                    <button
                      className="tr-view-btn"
                      onClick={() => handleViewOnline(note._id)}
                      disabled={viewing === note._id}
                      title={viewing === note._id ? "Opening..." : "View note online"}
                    >
                      {viewing === note._id ? "Opening..." : "View"}
                    </button>

                    <button
                      className="tr-download-btn"
                      onClick={() => handleDownload(note._id, note.title)}
                      disabled={downloading === note._id}
                      title={downloading === note._id ? "Downloading..." : "Download note"}
                    >
                      {downloading === note._id
                        ? <><span className="tr-spinner" /> Downloading...</>
                        : <>Download</>
                      }
                    </button>

                    <button
                      className="tr-quiz-btn"
                      onClick={() => setExpandedNote(expandedNote === note._id ? null : note._id)}
                      title={expandedNote === note._id ? "Hide quiz" : "Generate AI quiz"}
                    >
                      {expandedNote === note._id ? "Hide" : "Quiz"}
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
                      {expandedCommentsNote === note._id ? "Hide" : "Comments"}
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
          </>
        )}

      </div>
    </div>
    );
  }

export default TopRated;
