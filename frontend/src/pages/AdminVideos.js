import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminFooter from "../components/AdminFooter";
import "../styles/dashboard.css";
import "../styles/adminDashboardUnique.css";
import "../styles/adminVideos.css";

const API = "http://localhost:5000/api";

const VIDEO_CATEGORIES = ["Lecture Video", "Paper Discussion", "Kuppi"];
const VALID_YEARS = ["1", "2", "3", "4"];
const VALID_SEMESTERS = ["1", "2"];
const MODULE_NAME_REGEX = /^[A-Za-z\s]+$/;
const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;
const ALLOWED_VIDEO_MIME = [
  "video/mp4",
  "video/x-matroska",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];
const ALLOWED_VIDEO_EXT = [".mp4", ".mkv", ".webm", ".mov", ".avi"];

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

  const validateUploadForm = () => {
    const cleanedTitle = title.trim();
    const cleanedModuleCode = moduleCode.trim().toUpperCase();
    const cleanedModuleName = moduleName.trim();
    const cleanedDescription = description.trim();

    if (cleanedTitle.length < 3 || cleanedTitle.length > 200) {
      return "Title must be between 3 and 200 characters";
    }

    if (!VIDEO_CATEGORIES.includes(category)) {
      return "Invalid category selected";
    }

    if (!VALID_YEARS.includes(academicYear)) {
      return "Academic year must be between 1 and 4";
    }

    if (!VALID_SEMESTERS.includes(semester)) {
      return "Semester must be 1 or 2";
    }

    if (!/^[A-Z0-9-]{2,40}$/.test(cleanedModuleCode)) {
      return "Module code must be 2-40 characters (A-Z, 0-9, -)";
    }

    if (cleanedModuleName.length > 120) {
      return "Module name cannot exceed 120 characters";
    }

    if (cleanedModuleName && !MODULE_NAME_REGEX.test(cleanedModuleName)) {
      return "Module name must contain letters only";
    }

    if (cleanedDescription.length > 500) {
      return "Description cannot exceed 500 characters";
    }

    if (!videoFile) {
      return "Video file is required";
    }

    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      return "Video size must be 250 MB or less";
    }

    const lowerName = (videoFile.name || "").toLowerCase();
    const hasAllowedExt = ALLOWED_VIDEO_EXT.some((ext) => lowerName.endsWith(ext));
    const hasAllowedMime = ALLOWED_VIDEO_MIME.includes(videoFile.type);

    if (!hasAllowedMime && !hasAllowedExt) {
      return "Only MP4, MKV, WEBM, MOV, or AVI video files are allowed";
    }

    return "";
  };

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

    const validationError = validateUploadForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("category", category);
    fd.append("academicYear", academicYear);
    fd.append("semester", semester);
    fd.append("moduleCode", moduleCode.trim().toUpperCase());
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
                minLength={3}
                maxLength={200}
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
                onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS301"
                pattern="[A-Z0-9-]{2,40}"
                title="Use 2-40 characters: A-Z, 0-9, and -"
                maxLength={40}
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
                pattern="[A-Za-z ]+"
                title="Module name must contain letters only"
                maxLength={120}
              />
            </div>

            <div className="av-field av-field-full">
              <label>Description (optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add short summary"
                maxLength={500}
              />
            </div>

            <div className="av-field av-field-full">
              <label>Video File</label>
              <input
                type="file"
                accept=".mp4,.mkv,.webm,.mov,.avi,video/mp4,video/x-matroska,video/webm,video/quicktime,video/x-msvideo"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
              <small className="av-help-text">Allowed: MP4, MKV, WEBM, MOV, AVI. Max size: 250 MB.</small>
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
      <AdminFooter />
    </div>
  );
};

export default AdminVideos;
