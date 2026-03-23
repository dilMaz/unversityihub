import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/TopRated.css";

function TopRated() {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(null);

  // 🔥 Fetch Top Notes
  const fetchTopNotes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notes/top");
      setNotes(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopNotes();
  }, []);

  // 📥 Download ✅ Fixed
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
      fetchTopNotes();
    } catch (err) {
      console.log(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="tr-root">
      <div className="tr-wrap">

        {/* Header */}
        <div className="tr-header">
          <div className="tr-label">Rankings</div>
          <h1>Top <span>Rated</span> Notes</h1>
          <p>The most downloaded and highest rated notes by students.</p>
        </div>

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
        {!loading && notes.length === 0 && (
          <div className="tr-empty">
            <span>📭</span>
            <p>No top notes found yet.</p>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && notes.length > 0 && (
          <div className="tr-grid">
            {notes.map((note, index) => (
              <div
                className={`tr-card ${index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : ""}`}
                key={note._id}
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
                  <span className="tr-note-downloads">📥 {note.downloads} downloads</span>
                </div>

                {/* Download */}
                <button
                  className="tr-download-btn"
                  onClick={() => handleDownload(note._id)}
                  disabled={downloading === note._id}
                >
                  {downloading === note._id
                    ? <><span className="tr-spinner" /> Downloading...</>
                    : <>Download 📥</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default TopRated;