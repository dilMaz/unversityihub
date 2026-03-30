import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/adminVideos.css";
import { API_BASE_URL } from "../config/appConfig";

function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");

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

  const yearOptions = useMemo(() => {
    return [...new Set(videos.map((video) => String(video.academicYear || "")).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
  }, [videos]);

  const semesterOptions = useMemo(() => {
    return [...new Set(videos.map((video) => String(video.semester || "")).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
  }, [videos]);

  const moduleOptions = useMemo(() => {
    return [...new Set(videos.map((video) => [video.moduleCode, video.moduleName].filter(Boolean).join(" - ")).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const moduleLabel = [video.moduleCode, video.moduleName].filter(Boolean).join(" - ");
      const matchYear = selectedYear === "all" || String(video.academicYear) === selectedYear;
      const matchSemester = selectedSemester === "all" || String(video.semester) === selectedSemester;
      const matchModule = selectedModule === "all" || moduleLabel === selectedModule;
      return matchYear && matchSemester && matchModule;
    });
  }, [videos, selectedYear, selectedSemester, selectedModule]);

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
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{`Year ${year}`}</option>
                  ))}
                </select>
              </div>

              <div className="av-field">
                <label>Filter by Semester</label>
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                  <option value="all">All Semesters</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>{`Semester ${semester}`}</option>
                  ))}
                </select>
              </div>

              <div className="av-field av-field-full">
                <label>Filter by Module</label>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                  <option value="all">All Modules</option>
                  {moduleOptions.map((module) => (
                    <option key={module} value={module}>{module}</option>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Videos;
