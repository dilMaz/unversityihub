import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
<<<<<<< HEAD
import { API_BASE_URL } from "../config/appConfig";
=======
import NoteComments from "../components/NoteComments";
>>>>>>> 370cddcee951b7ab2487f4f62b3e3738b577515c
import "../styles/Search.css";

function Search() {
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedCommentsNote, setExpandedCommentsNote] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const debounceTimer = useRef(null);
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

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.filter(Boolean).slice(0, 8));
        }
      } catch (_err) {
        localStorage.removeItem("searchHistory");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const availableYears = useMemo(() => {
    const years = [...new Set(notes.map((n) => n.academicYear).filter(Boolean))];
    return years.length ? years.sort((a, b) => a - b) : [1, 2, 3, 4];
  }, [notes]);

  const availableSemesters = useMemo(() => {
    const semesters = [...new Set(notes.map((n) => n.semester).filter(Boolean))];
    return semesters.length ? semesters.sort((a, b) => a - b) : [1, 2];
  }, [notes]);

  const availableCategories = useMemo(
    () => [...new Set(notes.map((n) => n.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      let match = true;

      if (selectedYear !== "All") {
        match = match && note.academicYear === parseInt(selectedYear, 10);
      }

      if (selectedSemester !== "All") {
        match = match && note.semester === parseInt(selectedSemester, 10);
      }

      if (selectedCategory !== "All") {
        match = match && (note.category || "") === selectedCategory;
      }

      return match;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "downloads":
        sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case "title":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return sorted;
  }, [notes, selectedYear, selectedSemester, selectedCategory, sortBy]);

  // 🔍 Optimized search with debouncing
  const performSearch = useCallback(async (searchQuery) => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setNotes([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_ROOT}/api/notes?search=${encodeURIComponent(normalizedQuery)}`,
        { timeout: 10000 }
      );

      if (Array.isArray(response.data)) {
        setNotes(response.data);

        // Add to search history
        setSearchHistory((prevHistory) => {
          const newHistory = [
            normalizedQuery,
            ...prevHistory.filter((item) => item !== normalizedQuery),
          ].slice(0, 8);

          localStorage.setItem("searchHistory", JSON.stringify(newHistory));
          return newHistory;
        });
      } else {
        setError("Invalid response format from server");
        setNotes([]);
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("Search request timed out. Please try again.");
      } else if (err.response?.status === 404) {
        setError("No notes found matching your search.");
        setNotes([]);
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.message === "Network Error"
            ? "Cannot connect to server. Is backend running?"
            : "Failed to fetch notes. Please try again."
        );
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [API_ROOT]);

  // Debounced search handler
  const handleSearch = useCallback((value) => {
    setQuery(value);
    setError("");

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (wait 500ms before searching)
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  }, [performSearch]);

  // Enter key support for immediate search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      performSearch(query);
    }
  };

  // 📥 Download note with better error handling
  const handleDownload = useCallback(
    async (noteId, noteTitle) => {
      setDownloading(noteId);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login to download notes");
          setDownloading(null);
          return;
        }

        const response = await axios.put(
          `${API_ROOT}/api/notes/${noteId}/download`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );

        const publicUrl = getPublicFileUrl(response.data?.fileUrl);
        if (publicUrl) {
          await forceBrowserDownload(publicUrl, noteTitle);
        } else {
          setError("This note file is missing on server. Please re-upload it.");
        }

        // Update local notes with new download count
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === noteId
              ? { ...note, downloads: response.data.downloads }
              : note
          )
        );

        // Optional: Show success toast (you can add a toast library later)
        console.log(`Downloaded: ${noteTitle}`);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
        } else if (err.response?.status === 404) {
          setError(err.response?.data?.message || "Note not found");
        } else {
          setError("Failed to download. Please try again.");
        }
      } finally {
        setDownloading(null);
      }
    },
    [API_ROOT, forceBrowserDownload, getPublicFileUrl]
  );

  const handleViewOnline = useCallback(async (noteId) => {
    setViewing(noteId);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view notes");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/notes/${noteId}/view`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const publicUrl = getPublicFileUrl(res.data?.fileUrl);
      if (!publicUrl) {
        setError("This note file is missing on server. Please re-upload it.");
        return;
      }

      window.open(publicUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open note online");
    } finally {
      setViewing(null);
    }
  }, [API_BASE_URL, getPublicFileUrl]);

  // Clear search and results
  const handleClearSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setQuery("");
    setNotes([]);
    setError("");
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedYear("All");
    setSelectedSemester("All");
    setSelectedCategory("All");
    setSortBy("newest");
  }, []);

  const handleUseHistory = useCallback(
    (historyItem) => {
      setQuery(historyItem);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      performSearch(historyItem);
    },
    [performSearch]
  );

  const hasActiveFilters =
    selectedYear !== "All" || selectedSemester !== "All" || selectedCategory !== "All" || sortBy !== "newest";

  const filterSummary = [
    selectedYear !== "All" ? `Year ${selectedYear}` : null,
    selectedSemester !== "All" ? `Sem ${selectedSemester}` : null,
    selectedCategory !== "All" ? selectedCategory : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="search-root">
      <div className="search-wrap">
        {/* Header */}
        <div className="search-header">
          <div className="search-label">Notes</div>
          <h1>
            Search <span>Notes</span>
          </h1>
          <p>Find any note by title, subject, or keyword.</p>
        </div>

        {/* Search bar */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search notes"
            maxLength={100}
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => performSearch(query)}
            disabled={loading || !query.trim()}
            className="search-btn"
            title="Search"
          >
            {loading ? (
              <span className="search-spinner" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Year and Semester Filters */}
        {notes.length > 0 && (
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">📅 Year:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${selectedYear === "All" ? "active" : ""}`}
                  onClick={() => setSelectedYear("All")}
                >
                  All
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    className={`filter-btn ${selectedYear === year.toString() ? "active" : ""}`}
                    onClick={() => setSelectedYear(year.toString())}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">🔢 Semester:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${selectedSemester === "All" ? "active" : ""}`}
                  onClick={() => setSelectedSemester("All")}
                >
                  All
                </button>
                {availableSemesters.map((sem) => (
                  <button
                    key={sem}
                    className={`filter-btn ${selectedSemester === sem.toString() ? "active" : ""}`}
                    onClick={() => setSelectedSemester(sem.toString())}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">📂 Category:</label>
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">↕ Sort:</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="downloads">Most Downloaded</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button type="button" className="filter-reset-btn" onClick={handleClearFilters}>
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="search-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Results info */}
        {filteredNotes.length > 0 && !loading && (
          <div className="search-results-label">
            Found <strong>{filteredNotes.length}</strong> result{filteredNotes.length !== 1 ? "s" : ""}
            {filterSummary && <span className="search-filter-summary">({filterSummary})</span>}
          </div>
        )}

        {/* Search history */}
        {!query && searchHistory.length > 0 && notes.length === 0 && !loading && (
          <div className="search-history">
            <div className="search-history-title">Recent Searches</div>
            <div className="search-history-items">
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  className="search-history-btn"
                  onClick={() => handleUseHistory(item)}
                >
                  🕐 {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="search-loading">
            <div className="search-spinner-large" />
            <p>Searching notes...</p>
          </div>
        )}

        {/* Results */}
        <div className="search-results">
          {/* Empty state */}
          {filteredNotes.length === 0 && !loading && !error && (
            <div className="search-empty">
              <span>📭</span>
              <p>
                {query
                  ? "No results found. Try different keywords."
                  : "Type something to search for notes."}
              </p>
            </div>
          )}

          {/* Notes list */}
          {filteredNotes.map((note) => (
            <div key={note._id} className="search-note-wrapper">
              <div className="note-card">
                <div className="note-card-glow" />

                <div className="note-card-top">
                  <div className="note-icon">📄</div>
                  <div className="note-meta">
                    <span className="note-subject">{note.subject}</span>
                    <span className="note-year">📅 Year {note.academicYear}</span>
                    <span className="note-semester">🔢 Sem {note.semester}</span>
                    <span className="note-downloads">
                      📥 {note.downloads || 0} downloads
                    </span>
                  </div>
                </div>

                <h3 className="note-title">{note.title}</h3>

                {note.moduleCode && (
                  <span className="note-module">{note.moduleCode}</span>
                )}

                <div className="note-actions">
                  <button
                    className="note-view-btn"
                    onClick={() => handleViewOnline(note._id)}
                    disabled={viewing === note._id}
                    aria-label={`View ${note.title} online`}
                  >
                    {viewing === note._id ? "Opening..." : "View 👀"}
                  </button>

                  <button
                    className="note-download-btn"
                    onClick={() => handleDownload(note._id, note.title)}
                    disabled={downloading === note._id}
                    aria-label={`Download ${note.title}`}
                  >
                    {downloading === note._id ? (
                      <>
                        <span className="search-spinner" /> Downloading...
                      </>
                    ) : (
                      <>Download 📥</>
                    )}
                  </button>

                  <button
                    className="note-quiz-btn"
                    onClick={() =>
                      setExpandedNote(expandedNote === note._id ? null : note._id)
                    }
                    aria-label={`${
                      expandedNote === note._id ? "Hide" : "Show"
                    } quiz for ${note.title}`}
                  >
                    {expandedNote === note._id ? "Hide Quiz ▼" : "Quiz 📝"}
                  </button>

                  <button
                    className="note-comments-btn"
                    onClick={() =>
                      setExpandedCommentsNote(
                        expandedCommentsNote === note._id ? null : note._id
                      )
                    }
                    aria-label={`${
                      expandedCommentsNote === note._id ? "Hide" : "Show"
                    } comments for ${note.title}`}
                  >
                    {expandedCommentsNote === note._id ? "Hide Comments ▼" : "Comments 💬"}
                  </button>
                </div>
              </div>

              {/* Quiz Section */}
              {expandedNote === note._id && (
                <div className="note-quiz-container">
                  <QuizSection noteId={note._id} />
                </div>
              )}

              {expandedCommentsNote === note._id && (
                <div className="note-comments-container">
                  <NoteComments noteId={note._id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
<<<<<<< HEAD
=======

      <style jsx>{`
        .search-clear-btn {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 18px;
          padding: 0 8px;
          transition: color 0.2s;
        }

        .search-clear-btn:hover {
          color: #333;
        }

        .search-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-loading {
          text-align: center;
          padding: 40px 20px;
        }

        .note-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .note-view-btn,
        .note-comments-btn {
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
        }

        .note-view-btn {
          background: rgba(124, 92, 252, 0.18);
          color: #d6ccff;
        }

        .note-comments-btn {
          background: rgba(224, 95, 255, 0.16);
          color: #efb2ff;
        }

        .note-view-btn:hover,
        .note-comments-btn:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .note-view-btn:disabled,
        .note-comments-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .note-comments-container {
          margin-top: 10px;
          animation: slideDown 0.2s ease-out;
        }

        .search-spinner-large {
          width: 40px;
          height: 40px;
          border: 4px solid #eee;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .search-history {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-history-title {
          font-weight: 700;
          color: #667eea;
          margin-bottom: 16px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-history-title::before {
          content: "🕐";
          font-size: 18px;
        }

        .search-history-items {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .search-history-btn {
          background: white;
          border: 1px solid #e0e0e0;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #667eea;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .search-history-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
          transition: left 0.3s ease;
          z-index: -1;
        }

        .search-history-btn:hover {
          border-color: #667eea;
          background: linear-gradient(135deg, white 0%, #f8f9ff 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
          color: #667eea;
          font-weight: 600;
        }

        .search-history-btn:active {
          transform: translateY(0);
        }

        .note-module {
          display: inline-block;
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }

        .search-note-wrapper {
          margin-bottom: 20px;
        }

        .note-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .note-quiz-btn {
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

        .note-quiz-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .note-quiz-container {
          margin-top: -10px;
          padding: 0 16px 16px 16px;
        }

        .search-btn {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .search-btn:hover:not(:disabled) {
          background: #764ba2;
          transform: translateY(-2px);
        }

        .search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
>>>>>>> 370cddcee951b7ab2487f4f62b3e3738b577515c
    </div>
  );
}

export default Search;