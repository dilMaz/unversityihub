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

  const grouped = useMemo(() => {
    const map = {};
    videos.forEach((video) => {
      const yearKey = `Year ${video.academicYear || "-"}`;
      const semesterKey = `Semester ${video.semester || "-"}`;
      const moduleKey = [video.moduleCode, video.moduleName].filter(Boolean).join(" - ") || "General Module";

      if (!map[yearKey]) map[yearKey] = {};
      if (!map[yearKey][semesterKey]) map[yearKey][semesterKey] = {};
      if (!map[yearKey][semesterKey][moduleKey]) map[yearKey][semesterKey][moduleKey] = [];

      map[yearKey][semesterKey][moduleKey].push(video);
    });
    return map;
  }, [videos]);

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

        {loading ? (
          <div className="av-empty">Loading videos...</div>
        ) : error ? (
          <div className="av-alert error">{error}</div>
        ) : videos.length === 0 ? (
          <div className="av-empty">No videos uploaded yet.</div>
        ) : (
          <div className="av-organized">
            {Object.entries(grouped).map(([year, semesters]) => (
              <div key={year} className="av-year-section">
                <h2 className="av-year-title">{year}</h2>
                {Object.entries(semesters).map(([semester, modules]) => (
                  <div key={semester} className="av-semester-section">
                    <h3 className="av-semester-title">{semester}</h3>
                    {Object.entries(modules).map(([moduleKey, moduleVideos]) => (
                      <div key={moduleKey} className="av-module-section">
                        <h4 className="av-module-title">{moduleKey}</h4>
                        <div className="av-list">
                          {moduleVideos.map((video) => (
                            <div key={video._id} className="av-card">
                              <div className="av-head">
                                <h3>{video.title}</h3>
                                <span className="av-category">{video.category}</span>
                              </div>
                              <div className="av-meta">
                                <span>{`Year ${video.academicYear} / Semester ${video.semester}`}</span>
                                {video.uploadedBy?.name ? <span>{`By ${video.uploadedBy.name}`}</span> : null}
                              </div>
                              {video.description ? <p className="av-desc">{video.description}</p> : null}

                              <video controls preload="metadata" className="av-player" src={getVideoUrl(video.videoPath)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Videos;
