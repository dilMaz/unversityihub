import { useState } from "react";
import axios from "axios";
import "../styles/Search.css";

function Search() {
  const [query, setQuery]   = useState("");
  const [notes, setNotes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // 🔍 Search function
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/notes?search=${query}`
      );
      setNotes(res.data);
    } catch (err) {
      console.log(err);
      alert("Search error");
    } finally {
      setLoading(false);
    }
  };

  // Enter key support
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 📥 Download function ✅ Fixed
  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const token = localStorage.getItem("token"); // ✅ token ගන්න
      await axios.put(
        `http://localhost:5000/api/notes/${id}/download`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }, // ✅ token යවන්න
        }
      );
      handleSearch();
    } catch (err) {
      console.log(err);
      alert("Download error");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="search-root">
      <div className="search-wrap">

        {/* Header */}
        <div className="search-header">
          <div className="search-label">Notes</div>
          <h1>Search <span>Notes</span></h1>
          <p>Find any note by title, subject, or keyword.</p>
        </div>

        {/* Search bar */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? <span className="search-spinner" /> : "Search"}
          </button>
        </div>

        {/* Divider */}
        {notes.length > 0 && (
          <div className="search-results-label">
            {notes.length} result{notes.length !== 1 ? "s" : ""} found
          </div>
        )}

        {/* Results */}
        <div className="search-results">
          {notes.length === 0 && !loading && (
            <div className="search-empty">
              <span>📭</span>
              <p>No results yet — try searching above.</p>
            </div>
          )}

          {notes.map((note) => (
            <div className="note-card" key={note._id}>
              <div className="note-card-glow" />

              <div className="note-card-top">
                <div className="note-icon">📄</div>
                <div className="note-meta">
                  <span className="note-subject">{note.subject}</span>
                  <span className="note-downloads">📥 {note.downloads} downloads</span>
                </div>
              </div>

              <h3 className="note-title">{note.title}</h3>

              <button
                className="note-download-btn"
                onClick={() => handleDownload(note._id)}
                disabled={downloading === note._id}
              >
                {downloading === note._id
                  ? <><span className="search-spinner" /> Downloading...</>
                  : <>Download 📥</>
                }
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Search;