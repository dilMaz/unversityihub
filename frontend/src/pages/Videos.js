import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/adminVideos.css";
import { API_BASE_URL } from "../config/appConfig";

const YEAR_FILTER_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const SEMESTER_FILTER_OPTIONS = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
];

const MODULE_FILTER_OPTIONS = ["IT2010", "IT2020", "IT2040", "IT2050", "IT2060"];
const CATEGORY_FILTER_OPTIONS = ["Lecture Video", "Paper Discussion", "Kuppi"];
const REACTION_OPTIONS = [
  { value: "good", icon: "👍" },
  { value: "bad", icon: "👎" },
];

function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reactionsByVideo, setReactionsByVideo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchVideos = async () => {
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/videos/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVideos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load videos");
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [navigate]);

  const getVideoUrl = (videoPath) => {
    if (!videoPath) return "";
    return `${API_BASE_URL}/${String(videoPath).replace(/^\//, "")}`;
  };

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchYear = selectedYear === "all" || String(video.academicYear) === selectedYear;
      const matchSemester = selectedSemester === "all" || String(video.semester) === selectedSemester;
      const matchModule = selectedModule === "all" || String(video.moduleCode || "").toUpperCase() === selectedModule;
      const matchCategory = selectedCategory === "all" || String(video.category || "") === selectedCategory;
      return matchYear && matchSemester && matchModule && matchCategory;
    });
  }, [videos, selectedYear, selectedSemester, selectedModule, selectedCategory]);

  const handleReactionClick = (videoId, reaction) => {
    setReactionsByVideo((prev) => {
      const activeReaction = prev[videoId];
      if (activeReaction === reaction) {
        const next = { ...prev };
        delete next[videoId];
        return next;
      }
      return {
        ...prev,
        [videoId]: reaction,
      };
    });
  };

  const getReactionCount = (videoId, reaction) => {
    return reactionsByVideo[videoId] === reaction ? 1 : 0;
  };

  return (
    <div className="db-root admin-videos-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">UniHub Videos</div>
          <button className="db-logout" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Video Library</div>
          <h1>All Uploaded Videos</h1>
          <p>Browse all videos uploaded by admins, grouped by year, semester, and module.</p>
        </div>

        {!loading && !error && videos.length > 0 ? (
          <div className="av-form-card av-filter-card">
            <div className="av-grid">
              <div className="av-field">
                <label>Filter by Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  <option value="all">All Years</option>
                  {YEAR_FILTER_OPTIONS.map((year) => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>

              <div className="av-field">
                <label>Filter by Semester</label>
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                  <option value="all">All Semesters</option>
                  {SEMESTER_FILTER_OPTIONS.map((semester) => (
                    <option key={semester.value} value={semester.value}>{semester.label}</option>
                  ))}
                </select>
              </div>

              <div className="av-field av-field-full">
                <label>Filter by Module</label>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                  <option value="all">All Modules</option>
                  {MODULE_FILTER_OPTIONS.map((module) => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>

              <div className="av-field av-field-full">
                <label>Filter by Video Type</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">All Video Types</option>
                  {CATEGORY_FILTER_OPTIONS.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="av-empty">Loading videos...</div>
        ) : error ? (
          <div className="av-alert error">{error}</div>
        ) : filteredVideos.length === 0 ? (
          <div className="av-empty">No videos match the selected filters.</div>
        ) : (
          <div className="av-list">
            {filteredVideos.map((video) => (
              <div key={video._id} className="av-card">
                <div className="av-head">
                  <h3>{video.title}</h3>
                  <span className="av-category">{video.category}</span>
                </div>
                <div className="av-meta">
                  <span>{`Year ${video.academicYear} / Semester ${video.semester}`}</span>
                  <span>{[video.moduleCode, video.moduleName].filter(Boolean).join(" - ") || "General Module"}</span>
                  <span>{`Category: ${video.category || "General"}`}</span>
                  {video.uploadedBy?.name ? <span>{`By ${video.uploadedBy.name}`}</span> : null}
                </div>
                {video.description ? <p className="av-desc">{video.description}</p> : null}

                <video controls preload="metadata" className="av-player" src={getVideoUrl(video.videoPath)} />

                <div className="av-reactions">
                  <div className="av-reactions-row">
                    {REACTION_OPTIONS.map((reaction) => {
                      const isActive = reactionsByVideo[video._id] === reaction.value;
                      return (
                        <button
                          key={`${video._id}-${reaction.value}`}
                          type="button"
                          className={`av-reaction-btn ${isActive ? "active" : ""}`}
                          onClick={() => handleReactionClick(video._id, reaction.value)}
                        >
                          <span>{reaction.icon}</span>
                          <span className="av-reaction-count">{getReactionCount(video._id, reaction.value)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Videos;
