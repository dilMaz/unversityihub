import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import { API_BASE_URL } from "../config/appConfig";
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
  const [expandedNote, setExpandedNote] = useState(null);
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
                </div>
              </div>

              {/* Quiz Section */}
              {expandedNote === note._id && (
                <div className="note-quiz-container">
                  <QuizSection noteId={note._id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Search;