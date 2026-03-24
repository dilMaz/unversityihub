import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/upload.css";

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [moduleCode, setModuleCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type and size
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(selectedFile.type)) {
        setError("Only PDF and Word documents are allowed");
        return;
      }

      if (selectedFile.size > maxSize) {
        setError("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const fileChangeEvent = {
        target: {
          files: [droppedFile],
        },
      };
      handleFileChange(fileChangeEvent);
    }
  }, [handleFileChange]);
  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      navigate("/login");
      return;
    }

    // Validation
    if (!file || !academicYear || !semester) {
      setError("Please fill in all required fields and select a semester");
      return;
    }

    const derivedTitle = (file.name || "Uploaded Note")
      .replace(/\.[^/.]+$/, "")
      .trim()
      .slice(0, 100) || "Uploaded Note";
    const derivedSubject = moduleName.trim() || moduleCode.trim() || "General";
    const defaultCategory = "Lecture Notes";

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("noteFile", file);
      formData.append("title", derivedTitle);
      formData.append("subject", derivedSubject);
      formData.append("moduleCode", moduleCode);
      formData.append("moduleName", moduleName);
      formData.append("description", description);
      formData.append("category", defaultCategory);
      formData.append("academicYear", academicYear);
      formData.append("semester", semester);

      await axios.post(
        "http://localhost:5000/api/notes/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      setSuccess(true);
      setFile(null);
      setModuleCode("");
      setModuleName("");
      setDescription("");
      setAcademicYear("");
      setSemester("");

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      let errorMessage = "Failed to upload note";

      if (err.code === "ECONNABORTED") {
        errorMessage = "Upload timed out. Please try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        localStorage.removeItem("token");
        navigate("/login");
      } else if (err.response?.status === 413) {
        errorMessage = "File is too large. Maximum size is 50MB.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Invalid input. Please check your data.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Check your connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        <div className="upload-header">
          <h1>📤 Upload Notes</h1>
          <p>Share your study materials with the community</p>
        </div>

        {error && (
          <div className="upload-alert error">
            <span>❌</span>
            <div>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="upload-alert success">
            <span>✅</span>
            <div>
              <p>Notes uploaded successfully! Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* File Upload */}
          <div className="form-section">
            <label className="form-label">📄 Upload File *</label>
            <div
              className={`file-drag-area ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="file-selected">
                  <div className="file-icon">📎</div>
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="file-change"
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <div className="placeholder-icon">📁</div>
                  <p className="placeholder-text">
                    Drag and drop your file here
                  </p>
                  <p className="placeholder-hint">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                  <button
                    type="button"
                    className="browse-btn"
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    Browse Files
                  </button>
                </div>
              )}
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-row">
            <div className="form-section">
              <label className="form-label">📅 Academic Year *</label>
              <select
                className="form-input"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">🔢 Semester *</label>
              <div className="semester-radios">
                {[1, 2].map((sem) => (
                  <label key={sem} className="radio-label">
                    <input
                      type="radio"
                      name="semester"
                      value={sem}
                      checked={semester === sem.toString()}
                      onChange={(e) => setSemester(e.target.value)}
                    />
                    <span>Semester {sem}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">📌 Module Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., IT2234"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
                maxLength={20}
              />
            </div>

            <div className="form-section">
              <label className="form-label">📘 Module Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Object Oriented Programming"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">📖 Description (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Add a brief description of your notes (what topics are covered, any additional notes, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={8}
            />
            <small className="input-hint">{description.length}/500 characters</small>
          </div>

          {/* Guidelines */}
          <div className="guidelines">
            <h4>✨ Guidelines for Quality Notes</h4>
            <ul>
              <li>Clear and legible content</li>
              <li>Organized by topics or chapters</li>
              <li>Free from personal information</li>
              <li>Original work or properly cited</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                <>📤 Upload Notes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Upload;
