import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import NoteComments from "../components/NoteComments";
import programsData from "../data/ProgramsData";
import "../styles/categories.css";

function Categories() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [modules, setModules] = useState(["All"]);
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
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

  // Filter notes by category, subcategory, module, year, semester, and approval status
  useEffect(() => {
    let filtered = notes;

    // Filter by approval status (show only approved or legacy notes)
    filtered = filtered.filter((note) => note.moderationStatus === "approved" || !note.moderationStatus);

    // Filter by category and subcategory
    if (selectedCategory !== "All" || selectedSubcategory !== "All") {
      const validModuleCodes = new Set();
      const categoryData = selectedCategory !== "All" ? programsData.categories[selectedCategory] : null;
      if (categoryData) {
        const subcategories = selectedSubcategory !== "All" ? [selectedSubcategory] : Object.keys(categoryData.subcategories);
        subcategories.forEach(sub => {
          const subData = categoryData.subcategories[sub];
          if (subData && subData.years) {
            Object.values(subData.years).forEach(yearData => {
              if (yearData.semesters) {
                Object.values(yearData.semesters).forEach(semData => {
                  semData.forEach(module => validModuleCodes.add(module.code));
                });
              }
            });
          }
        });
      }
      if (validModuleCodes.size > 0) {
        filtered = filtered.filter((note) => validModuleCodes.has(note.moduleCode));
      }
    }

    // Filter by module
    if (selectedModule !== "All") {
      filtered = filtered.filter((note) => {
        const noteModule = (note.moduleName || note.moduleCode || "").trim();
        // Check if selectedModule matches the note's module exactly
        if (noteModule === selectedModule) return true;
        // Check if selectedModule is "CODE - NAME" and matches the note's moduleCode
        if (selectedModule.includes(" - ") && note.moduleCode === selectedModule.split(" - ")[0]) return true;
        return false;
      });
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
  }, [selectedCategory, selectedSubcategory, selectedModule, selectedYear, selectedSemester, notes]);

  // Update modules based on selected filters from ProgramsData
  useEffect(() => {
    let availableModules = new Set();

    // Add modules from ProgramsData based on selected category/subcategory/year/semester
    if (selectedCategory !== "All") {
      const categoryData = programsData.categories[selectedCategory];
      if (categoryData) {
        const subcategories = selectedSubcategory !== "All" ? [selectedSubcategory] : Object.keys(categoryData.subcategories);
        subcategories.forEach(sub => {
          const subData = categoryData.subcategories[sub];
          if (subData && subData.years) {
            const years = selectedYear !== "All" ? [selectedYear] : Object.keys(subData.years);
            years.forEach(year => {
              const yearData = subData.years[year];
              if (yearData && yearData.semesters) {
                const semesters = selectedSemester !== "All" ? [selectedSemester] : Object.keys(yearData.semesters);
                semesters.forEach(sem => {
                  const semData = yearData.semesters[sem];
                  if (semData) {
                    semData.forEach(module => {
                      availableModules.add(`${module.code} - ${module.name}`);
                    });
                  }
                });
              }
            });
          }
        });
      }
    }

    const sortedModules = Array.from(availableModules).sort((a, b) => a.localeCompare(b));
    setModules(["All", ...sortedModules]);

    if (!sortedModules.includes(selectedModule) && selectedModule !== "All") {
      setSelectedModule("All");
    }
  }, [selectedCategory, selectedSubcategory, selectedYear, selectedSemester, selectedModule]);

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

        {/* Category & Subcategory Filter */}
        {!loading && (
          <div className="filters-section">
            <div className="filter-group">
              <h3 className="filter-title">🏫 Select Category</h3>
              <select
                className="category-select"
                value={selectedCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCategory(value);
                  setSelectedSubcategory("All");
                  setSelectedYear("All");
                  setSelectedSemester("All");
                  setSelectedModule("All");
                }}
              >
                <option value="All">All Categories</option>
                {Object.keys(programsData.categories).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory !== "All" && (
              <div className="filter-group">
                <h3 className="filter-title">📚 Select Subcategory</h3>
                <select
                  className="category-select"
                  value={selectedSubcategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSubcategory(value);
                    setSelectedYear("All");
                    setSelectedSemester("All");
                    setSelectedModule("All");
                  }}
                >
                  <option value="All">All Subcategories</option>
                  {Object.keys(programsData.categories[selectedCategory].subcategories).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Year & Semester Filter - PRIMARY */}
          <div className="filters-section">
            <div className="filter-group">
              <h3 className="filter-title">📅 Select Academic Year</h3>
              <select
                className="category-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="All">All Years</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year.toString()}>
                    Year {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <h3 className="filter-title">🔢 Select Semester</h3>
              <select
                className="category-select"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="All">All Semesters</option>
                {[1, 2].map((sem) => (
                  <option key={sem} value={sem.toString()}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        
        {/* Active Filter Display */}
        {!loading && (selectedCategory !== "All" || selectedSubcategory !== "All" || selectedYear !== "All" || selectedSemester !== "All" || selectedModule !== "All") && (
          <div className="active-filter-display">
            <span className="filter-badge">
              {selectedCategory !== "All" ? `${selectedCategory}` : "All Categories"}
              {selectedSubcategory !== "All" ? ` > ${selectedSubcategory}` : ""}
              {" • "}
              {selectedYear !== "All" ? `Year ${selectedYear}` : "All Years"}
              {" • "}
              {selectedSemester !== "All" ? `Semester ${selectedSemester}` : "All Semesters"}
              {" • "}
              {selectedModule !== "All" ? `Module: ${selectedModule}` : "All Modules"}
            </span>
            
            {/* Chat button appears when a specific module is selected */}
            {selectedModule !== "All" && (
              <button
                className="module-chat-access-btn"
                onClick={() => {
                  const moduleCode = selectedModule.split(" - ")[0];
                  navigate(`/module/${moduleCode}`);
                }}
              >
                💬 Open {selectedModule.split(" - ")[0]} Chat
              </button>
            )}
          </div>
        )}

        {/* Module Filter - SECONDARY */}
        {!loading && (
          <div className="categories-filter">
            <h3 className="filter-title">📚 Filter by Module</h3>
            <select
              className="category-select"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod === "All" && "📂 All Modules"}
                  {mod !== "All" && `📖 ${mod}`}
                </option>
              ))}
            </select>
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
                    <h3 className="cat-title">{note.header || note.title}</h3>
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

                    <button
                      className="cat-chat-btn"
                      onClick={() => navigate(`/module/${note.moduleCode}`)}
                      title="Open module chat"
                    >
                      💬 Module Chat
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
