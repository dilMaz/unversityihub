import { useEffect, useState } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import "../styles/Recommended.css";

const SECTIONS = [
  {
    key:   "contentBased",
    icon:  "🎯",
    label: "Based on Your Activity",
    tag:   "Personalised",
    color: "purple",
  },
  {
    key:   "trending",
    icon:  "🔥",
    label: "Trending Notes",
    tag:   "Hot",
    color: "orange",
  },
  {
    key:   "recent",
    icon:  "🆕",
    label: "Latest Notes",
    tag:   "New",
    color: "green",
  },
];

function SkeletonCard() {
  return (
    <div className="rec-skeleton">
      <div className="sk sk-icon" />
      <div className="sk sk-title" />
      <div className="sk sk-sub" />
      <div className="sk sk-stat" />
    </div>
  );
}

function NoteCard({ note, color, index, onQuizClick, isExpanded }) {
  return (
    <div className="rec-note-card-wrapper">
      <div
        className={`rec-note-card color-${color}`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        <div className="rec-card-glow" />
        <div className="rec-card-icon">📄</div>
        <h3 className="rec-card-title">{note.title}</h3>
        <span className="rec-card-subject">{note.subject}</span>
        <div className="rec-card-footer">
          <span className="rec-card-downloads">📥 {note.downloads ?? 0}</span>
          <button
            className="rec-card-quiz-btn"
            onClick={() => onQuizClick(note._id)}
          >
            {isExpanded ? "▼" : "📝"}
          </button>
        </div>
      </div>

      {/* Quiz Section */}
      {isExpanded && (
        <div className="rec-quiz-container">
          <QuizSection noteId={note._id} />
        </div>
      )}
    </div>
  );
}

function Section({ icon, label, tag, color, notes, loading, expandedNote, onQuizClick }) {
  return (
    <div className="rec-section">
      <div className="rec-section-header">
        <div className="rec-section-left">
          <span className="rec-section-icon">{icon}</span>
          <h2 className="rec-section-title">{label}</h2>
        </div>
        <span className={`rec-section-tag tag-${color}`}>{tag}</span>
      </div>

      <div className="rec-scroll-row">
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : notes.length === 0 ? (
          <div className="rec-section-empty">
            <span>📭</span>
            <p>Nothing here yet</p>
          </div>
        ) : (
          notes.map((note, i) => (
            <NoteCard
              key={note._id}
              note={note}
              color={color}
              index={i}
              onQuizClick={onQuizClick}
              isExpanded={expandedNote === note._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Recommended() {
  const [data, setData]       = useState({ contentBased: [], trending: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [expandedNote, setExpandedNote] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/notes/recommend",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="rec-root">
      <div className="rec-wrap">

        <div className="rec-page-header">
          <div className="rec-page-label">AI Powered</div>
          <h1>Your <span>Recommendations</span></h1>
          <p>Curated picks across activity, trends, and fresh content.</p>
        </div>

        {SECTIONS.map((s) => (
          <Section
            key={s.key}
            icon={s.icon}
            label={s.label}
            tag={s.tag}
            color={s.color}
            notes={data[s.key]}
            loading={loading}
            expandedNote={expandedNote}
            onQuizClick={setExpandedNote}
          />
        ))}

      </div>

      <style jsx>{`
        .rec-note-card-wrapper {
          position: relative;
        }

        .rec-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rec-card-quiz-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          transition: transform 0.2s;
        }

        .rec-card-quiz-btn:hover {
          transform: scale(1.2);
        }

        .rec-quiz-container {
          margin-top: 12px;
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
      `}</style>
    </div>
  );
}

export default Recommended;

