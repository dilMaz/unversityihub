import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Recommended.css";

function Recommended() {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/notes/recommend",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotes(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  return (
    <div className="rec-root">
      <div className="rec-wrap">

        {/* Header */}
        <div className="rec-header">
          
          <h1><span>Recommended</span> Notes</h1>
          <p>Personalised picks based on your study history and interests.</p>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="rec-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="rec-skeleton-card" key={i}>
                <div className="sk sk-icon" />
                <div className="sk sk-title" />
                <div className="sk sk-sub" />
                <div className="sk sk-tag" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && notes.length === 0 && (
          <div className="rec-empty">
            <span>🤖</span>
            <p>No recommendations yet.</p>
            <small>Search and download a few notes to get started!</small>
          </div>
        )}

        {/* Grid */}
        {!loading && notes.length > 0 && (
          <>
            <div className="rec-count">
              {notes.length} suggestion{notes.length !== 1 ? "s" : ""} for you
            </div>
            <div className="rec-grid">
              {notes.map((note, index) => (
                <div className="rec-card" key={note._id}
                  style={{ animationDelay: `${index * 0.07}s` }}>
                  <div className="rec-card-glow" />

                  {/* AI badge */}
                  <div className="rec-ai-badge">🤖 AI Pick</div>

                  {/* Icon */}
                  <div className="rec-note-icon">📄</div>

                  {/* Info */}
                  <h3 className="rec-note-title">{note.title}</h3>
                  <span className="rec-note-subject">{note.subject}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default Recommended;
