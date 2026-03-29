import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/adminDashboardUnique.css";
import "../styles/adminVideos.css";

const API = "http://localhost:5000/api";

const VIDEO_CATEGORIES = ["Lecture Video", "Paper Discussion", "Kuppi"];

const AdminVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(VIDEO_CATEGORIES[0]);
  const [academicYear, setAcademicYear] = useState("1");
  const [semester, setSemester] = useState("1");
  const [moduleCode, setModuleCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVideos = useCallback(async () => {
    setError("");
    try {
      const res = await axios.get(`${API}/videos/admin/all`, {
        headers: authHeaders(),
      });
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchVideos();
  }, [navigate, fetchVideos]);

  const resetForm = () => {
    setTitle("");
    setCategory(VIDEO_CATEGORIES[0]);
    setAcademicYear("1");
    setSemester("1");
    setModuleCode("");
    setModuleName("");
    setDescription("");
    setVideoFile(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !moduleCode || !videoFile) {
      setError("Title, module code, and video file are required");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("category", category);
    fd.append("academicYear", academicYear);
    fd.append("semester", semester);
    fd.append("moduleCode", moduleCode.trim());
    fd.append("moduleName", moduleName.trim());
    fd.append("description", description.trim());
    fd.append("videoFile", videoFile);

    setSaving(true);
    try {
      const res = await axios.post(`${API}/videos/admin/upload`, fd, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(res?.data?.message || "Video uploaded successfully");
      resetForm();
      await fetchVideos();
    } catch (err) {
      setError(err?.response?.data?.message || "Video upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video?")) return;

    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      await axios.delete(`${API}/videos/admin/${id}`, {
        headers: authHeaders(),
      });
      setVideos((prev) => prev.filter((video) => video._id !== id));
      setSuccess("Video deleted successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  const getVideoUrl = (videoPath) => {
    if (!videoPath) return "";
    return `http://localhost:5000/${videoPath.replace(/^\//, "")}`;
  };

  return (
    <div className="db-root admin-theme admin-videos-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Videos</div>
          <button className="db-logout" onClick={() => navigate("/admin-dashboard")}> 
            Back to Admin
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Video Management</div>
          <h1>Upload Academic Videos</h1>
          <p>Only admins can add Lecture Video, Paper Discussion, and Kuppi resources.</p>
        </div>

        <div className="db-section-title">Upload New Video</div>
        <form className="av-form-card" onSubmit={handleUpload}>
          {error ? <div className="av-alert error">{error}</div> : null}
          {success ? <div className="av-alert success">{success}</div> : null}

          <div className="av-grid">
            <div className="av-field">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>

            <div className="av-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {VIDEO_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="av-field">
              <label>Academic Year</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div className="av-field">
              <label>Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div className="av-field">
              <label>Module Code</label>
              <input
                type="text"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                placeholder="e.g. CS301"
                required
              />
            </div>

            <div className="av-field">
              <label>Module Name (optional)</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. Operating Systems"
              />
            </div>

            <div className="av-field av-field-full">
              <label>Description (optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add short summary"
              />
            </div>

            <div className="av-field av-field-full">
              <label>Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>

          <button type="submit" className="av-submit" disabled={saving}>
            {saving ? "Uploading..." : "Upload Video"}
          </button>
        </form>

        <div className="db-section-title">Uploaded Videos</div>
        {loading ? (
          <div className="av-empty">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="av-empty">No videos uploaded yet.</div>
        ) : (
          <div className="av-list">
            {videos.map((video) => (
              <div key={video._id} className="av-card">
                <div className="av-head">
                  <h3>{video.title}</h3>
                  <span className="av-category">{video.category}</span>
                </div>
                <div className="av-meta">
                  <span>{`Year ${video.academicYear} / Semester ${video.semester}`}</span>
                  <span>{video.moduleCode}</span>
                  {video.moduleName ? <span>{video.moduleName}</span> : null}
                </div>
                {video.description ? <p className="av-desc">{video.description}</p> : null}

                <video controls preload="metadata" className="av-player" src={getVideoUrl(video.videoPath)} />

                <div className="av-actions">
                  <button
                    type="button"
                    className="db-danger-btn"
                    onClick={() => handleDelete(video._id)}
                    disabled={deletingId === video._id}
                  >
                    {deletingId === video._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideos;
