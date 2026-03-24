import { useEffect, useState } from "react";
import axios from "axios";
import QuizSection from "../components/QuizSection";
import NoteComments from "../components/NoteComments";
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

function NoteCard({
  note,
  color,
  index,
  onQuizClick,
  isExpanded,
  onDownload,
  onView,
  downloading,
  viewing,
  onCommentsClick,
  commentsExpanded,
}) {
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
          <div className="rec-card-actions">
            <button
              className="rec-card-action-btn rec-view"
              onClick={() => onView(note._id)}
              disabled={viewing === note._id}
            >
              {viewing === note._id ? "..." : "👀"}
            </button>
            <button
              className="rec-card-action-btn rec-download"
              onClick={() => onDownload(note._id, note.title)}
              disabled={downloading === note._id}
            >
              {downloading === note._id ? "..." : "📥"}
            </button>
            <button
              className="rec-card-action-btn rec-comments"
              onClick={() => onCommentsClick(note._id)}
            >
              {commentsExpanded ? "▼" : "💬"}
            </button>
            <button
              className="rec-card-quiz-btn"
              onClick={() => onQuizClick(note._id)}
            >
              {isExpanded ? "▼" : "📝"}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Section */}
      {isExpanded && (
        <div className="rec-quiz-container">
          <QuizSection noteId={note._id} />
        </div>
      )}

      {commentsExpanded && (
        <div className="rec-comments-container">
          <NoteComments noteId={note._id} />
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  label,
  tag,
  color,
  notes,
  loading,
  expandedNote,
  onQuizClick,
  onDownload,
  onView,
  downloading,
  viewing,
  expandedCommentsNote,
  onCommentsClick,
}) {
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
              onDownload={onDownload}
              onView={onView}
              downloading={downloading}
              viewing={viewing}
              commentsExpanded={expandedCommentsNote === note._id}
              onCommentsClick={onCommentsClick}
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
  const [expandedCommentsNote, setExpandedCommentsNote] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);

  const getPublicFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    const normalized = fileUrl.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    return `http://localhost:5000/${normalized}`;
  };

  const forceBrowserDownload = async (publicUrl, title) => {
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
  };

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

  const handleDownload = async (id, title) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setDownloading(id);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/notes/${id}/download`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      const publicUrl = getPublicFileUrl(res.data?.fileUrl);
      if (publicUrl) {
        await forceBrowserDownload(publicUrl, title);
      }
    } catch (_err) {
      // Keep silent in this compact card UI
    } finally {
      setDownloading(null);
    }
  };

  const handleView = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setViewing(id);
    try {
      const res = await axios.get(`http://localhost:5000/api/notes/${id}/view`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const publicUrl = getPublicFileUrl(res.data?.fileUrl);
      if (publicUrl) {
        window.open(publicUrl, "_blank", "noopener,noreferrer");
      }
    } catch (_err) {
      // Keep silent in this compact card UI
    } finally {
      setViewing(null);
    }
  };

  const handleCommentsToggle = (id) => {
    setExpandedCommentsNote((prev) => (prev === id ? null : id));
  };

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
            onDownload={handleDownload}
            onView={handleView}
            downloading={downloading}
            viewing={viewing}
            expandedCommentsNote={expandedCommentsNote}
            onCommentsClick={handleCommentsToggle}
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
          gap: 10px;
        }

        .rec-card-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .rec-card-action-btn,
        .rec-card-quiz-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          transition: transform 0.2s;
        }

        .rec-card-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rec-card-quiz-btn {
          color: #f0eeff;
        }

        .rec-card-quiz-btn:hover,
        .rec-card-action-btn:hover {
          transform: scale(1.2);
        }

        .rec-quiz-container {
          margin-top: 12px;
          animation: slideDown 0.3s ease-out;
        }

        .rec-comments-container {
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

