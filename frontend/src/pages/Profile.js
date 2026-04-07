import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import "../styles/dashboard.css";
import "../styles/profile.css";

const API = "http://localhost:5000/api";

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  // Study Activity Tracker state
  const [studyHours, setStudyHours] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayHours, setTodayHours] = useState(0);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [showActivitySection, setShowActivitySection] = useState(false);

  const [draft, setDraft] = useState({
    name: "",
    email: "",
    nic: "",
    status: "undergraduate",
    studentNumber: "",
    phone: "",
    specialization: "",
    year: "",
    semester: "",
    password: "",
  });

  const avatarUrl = (rel) => {
    if (!rel) return "";
    return `http://localhost:5000/uploads/${String(rel).replace(/^\/+/, "")}`;
  };

  // Study Activity Tracker Functions
  const markStudyHour = (hour) => {
    setSelectedHour(hour);
    setShowActivityModal(true);
  };

  const confirmStudyHour = () => {
    if (selectedHour) {
      const newStudyHour = {
        id: Date.now(),
        date: currentDate,
        hour: selectedHour,
        completedAt: new Date().toISOString(),
        subject: "Study Session"
      };
      
      setStudyHours([...studyHours, newStudyHour]);
      setTodayHours(todayHours + 1);
      setShowActivityModal(false);
      setSelectedHour(null);
      
      // Show success message
      if (todayHours + 1 === 10) {
        alert("🎉 Congratulations! You've completed 10 hours of study today!");
      } else {
        alert(`✅ Great job! You've completed ${todayHours + 1} hour${todayHours + 1 > 1 ? 's' : ''} of study today!`);
      }
    }
  };

  const cancelStudyHour = () => {
    setShowActivityModal(false);
    setSelectedHour(null);
  };

  const getTodayStudyHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyHours.filter(hour => hour.date === today).length;
  };

  const getWeeklyProgress = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return studyHours.filter(hour => {
      const hourDate = new Date(hour.date);
      return hourDate >= weekStart && hourDate <= weekEnd;
    }).length;
  };

  const getAvailableHours = () => {
    const completedHours = studyHours
      .filter(hour => hour.date === currentDate)
      .map(hour => hour.hour)
      .sort((a, b) => a - b);
    
    // Find the next available hour (sequential)
    let nextHour = 1;
    for (let i = 1; i <= 10; i++) {
      if (!completedHours.includes(i)) {
        nextHour = i;
        break;
      }
    }
    
    // Only return the next sequential hour if any hours are completed
    // If no hours completed, allow Hour 1
    // If some hours completed, only allow the next one
    if (completedHours.length === 0) {
      return [1]; // Only allow Hour 1 if nothing completed yet
    } else if (nextHour <= 10) {
      return [nextHour]; // Only allow the next sequential hour
    } else {
      return []; // All hours completed
    }
  };

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Profile loaded, avatar:', res.data.avatar);
      setProfile(res.data || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile) return;
    if (editMode) return;
    setDraft({
      name: profile?.name || "",
      email: profile?.email || "",
      nic: profile?.nic || "",
      status: profile?.status || "undergraduate",
      studentNumber: profile?.studentNumber || profile?.itNumber || "",
      phone: profile?.phone || "",
      specialization: profile?.specialization || "",
      year: profile?.year === undefined || profile?.year === null ? "" : String(profile.year),
      semester:
        profile?.semester === undefined || profile?.semester === null
          ? ""
          : String(profile.semester),
      password: "",
    });
  }, [profile, editMode]);

  const clearAvatarSelection = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setCroppedImageUrl(null);
    setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
    setImageRef(null);
  };

  const v = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    return String(val);
  };

  const isAdmin = (profile?.role || "").toLowerCase() === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const generateCroppedImage = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!crop || !image) return null;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = 200; // Fixed avatar size
    canvas.height = 200;
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      200,
      200
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCropConfirm = async () => {
    if (imageRef && crop.width && crop.height) {
      const croppedFile = await generateCroppedImage(imageRef, crop);
      if (croppedFile) {
        setAvatarFile(croppedFile);
        setCroppedImageUrl(URL.createObjectURL(croppedFile));
        
        const token = localStorage.getItem("token");
        const fd = new FormData();
        fd.append("avatar", croppedFile);
        
        try {
          await axios.patch(`${API}/profile/me/avatar`, fd, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          
          console.log('Avatar uploaded successfully, clearing preview and reloading profile...');
          // Clear preview URLs after successful upload
          setAvatarPreviewUrl(null);
          setCroppedImageUrl(null);
          await loadProfile();
        } catch (err) {
          console.error('Error uploading cropped image:', err);
        }
      }
    }
    setShowCropModal(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    clearAvatarSelection();
  };

  const handleImageLoad = (e) => {
    const image = e.target;
    const rect = image.getBoundingClientRect();
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    
    // Set initial crop to center rectangle (not square)
    const initialWidth = Math.min(width * 0.6, 200);
    const initialHeight = Math.min(height * 0.6, 200);
    const x = (width - initialWidth) / 2;
    const y = (height - initialHeight) / 2;
    
    setCrop({
      unit: 'px',
      width: initialWidth,
      height: initialHeight,
      x: x,
      y: y,
      imageWidth: width,
      imageHeight: height,
      displayWidth: rect.width,
      displayHeight: rect.height
    });
  };

  const handleCropMouseDown = (e) => {
    e.preventDefault();
    const overlay = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialCropX = crop.x;
    const initialCropY = crop.y;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Convert pixel movement to image coordinates
      const scaleX = crop.imageWidth / crop.displayWidth;
      const scaleY = crop.imageHeight / crop.displayHeight;
      
      const newX = Math.max(0, Math.min(initialCropX + deltaX * scaleX, crop.imageWidth - crop.width));
      const newY = Math.max(0, Math.min(initialCropY + deltaY * scaleY, crop.imageHeight - crop.height));
      
      setCrop(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialCrop = { ...crop };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = initialCrop.width;
      let newHeight = initialCrop.height;
      let newX = initialCrop.x;
      let newY = initialCrop.y;

      // Handle width resizing
      if (direction.includes('right')) {
        newWidth = Math.max(50, Math.min(initialCrop.width + deltaX, initialCrop.imageWidth - initialCrop.x));
      }
      if (direction.includes('left')) {
        newWidth = Math.max(50, Math.min(initialCrop.width - deltaX, initialCrop.x + initialCrop.width));
        newX = initialCrop.x + (initialCrop.width - newWidth);
      }

      // Handle height resizing (independent from width)
      if (direction.includes('bottom')) {
        newHeight = Math.max(50, Math.min(initialCrop.height + deltaY, initialCrop.imageHeight - initialCrop.y));
      }
      if (direction.includes('top')) {
        newHeight = Math.max(50, Math.min(initialCrop.height - deltaY, initialCrop.y + initialCrop.height));
        newY = initialCrop.y + (initialCrop.height - newHeight);
      }

      setCrop(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      clearAvatarSelection();
      return;
    }
    
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setShowCropModal(true);
  };

  const handleAvatarClick = () => {
    document.getElementById('avatar-upload-input').click();
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await axios.patch(`${API}/profile/me/avatar`, fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const payload = {
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        password: draft.password !== "" ? draft.password : undefined,
      };

      if (isAdmin) {
        payload.nic = draft.nic.trim().toUpperCase();
        payload.status = draft.status;
      } else {
        payload.studentNumber = draft.studentNumber.trim();
        payload.nic = draft.nic.trim().toUpperCase();
        payload.specialization = draft.specialization.trim();
        if (draft.year !== "") payload.year = Number(draft.year);
        if (draft.semester !== "") payload.semester = Number(draft.semester);
      }

      await axios.patch(`${API}/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditMode(false);
      clearAvatarSelection();
      await loadProfile();
    } catch (err) {
      setSaveError(err?.response?.data?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Profile</div>
          <div className="db-topbar-actions">
            <button
              type="button"
              className="db-profile-btn"
              onClick={() => navigate("/dashboard")}
            >
              ← Back
            </button>
            <button type="button" className="db-logout" onClick={logout}>
              <span>↩</span> Sign out
            </button>
          </div>
        </div>

        <div className="pr-hero">
          <div className="pr-hero-header">
            <div className="db-greeting">Your Profile</div>
            <div className="pr-hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
              </svg>
              <span>Verified</span>
            </div>
          </div>
          <div className="pr-name-row">
            <div className="pr-avatar-container">
              <div className="pr-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {avatarPreviewUrl || profile?.avatar ? (
                  <img
                    src={
                      avatarPreviewUrl
                        ? avatarPreviewUrl
                        : avatarUrl(profile?.avatar)
                    }
                    alt="Profile"
                  />
                ) : (
                  <span className="pr-avatar-fallback">
                    {(profile?.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="pr-camera-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div className="pr-user-info">
              <h1>{v(profile?.name)}</h1>
              <span className="pr-user-id">ID: {v(profile?.studentNumber || profile?.itNumber)}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pr-loading">
            <div className="pr-spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="pr-error-state">
            <h3>Unable to Load Profile</h3>
            <p>{error}</p>
            <button className="pr-retry-btn" onClick={loadProfile}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="pr-content-wrapper">
            {!editMode ? (
              <>
                <div className="pr-card">
                  <div className="pr-row">
                    <div className="pr-label">Name</div>
                    <div className="pr-value">{v(profile?.name)}</div>
                  </div>
                  <div className="pr-row">
                    <div className="pr-label">Email</div>
                    <div className="pr-value">{v(profile?.email)}</div>
                  </div>
                  {isAdmin ? (
                    <>
                      <div className="pr-row">
                        <div className="pr-label">NIC</div>
                        <div className="pr-value">{v(profile?.nic)}</div>
                      </div>
                      <div className="pr-row">
                        <div className="pr-label">Status</div>
                        <div className="pr-value">{v(profile?.status)}</div>
                      </div>
                    </>
                  ) : (
                    <div className="pr-row">
                      <div className="pr-label">Student Number</div>
                      <div className="pr-value">{v(profile?.studentNumber || profile?.itNumber)}</div>
                    </div>
                  )}
                  <div className="pr-row">
                    <div className="pr-label">Phone number</div>
                    <div className="pr-value">{v(profile?.phone)}</div>
                  </div>
                  {!isAdmin ? (
                    <>
                      <div className="pr-row">
                        <div className="pr-label">Specialization</div>
                        <div className="pr-value">{v(profile?.specialization)}</div>
                      </div>
                      <div className="pr-row">
                        <div className="pr-label">Year</div>
                        <div className="pr-value">{v(profile?.year)}</div>
                      </div>
                      <div className="pr-row">
                        <div className="pr-label">Semester</div>
                        <div className="pr-value">{v(profile?.semester)}</div>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="pr-actions">
                  <button
                    type="button"
                    className="pr-primary-btn"
                    onClick={() => {
                      setSaveError("");
                      setEditMode(true);
                      clearAvatarSelection();
                    }}
                  >
                    Edit details
                  </button>
                </div>
              </>
            ) : (
              <form className="pr-card pr-edit-form" onSubmit={onSave}>
                {saveError ? <div className="pr-error">{saveError}</div> : null}
                <div className="pr-form-grid">
                  <div className="pr-field">
                    <label className="pr-label">Name</label>
                    <input
                      className="pr-input"
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="pr-field">
                    <label className="pr-label">Email</label>
                    <input
                      className="pr-input"
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      required
                    />
                  </div>

                  {isAdmin ? (
                    <div className="pr-field">
                      <label className="pr-label">NIC</label>
                      <input
                        className="pr-input"
                        type="text"
                        value={draft.nic}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, nic: e.target.value.toUpperCase() }))
                        }
                        placeholder="200123456789 or 123456789V"
                        required
                      />
                    </div>
                  ) : (
                    <div className="pr-field">
                      <label className="pr-label">Student Number</label>
                      <input
                        className="pr-input"
                        type="text"
                        value={draft.studentNumber}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, studentNumber: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  <div className="pr-field">
                    <label className="pr-label">Phone number</label>
                    <input
                      className="pr-input"
                      type="tel"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                    />
                  </div>

                  {isAdmin ? (
                    <div className="pr-field">
                      <label className="pr-label">Status</label>
                      <select
                        className="pr-input"
                        value={draft.status}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, status: e.target.value }))
                        }
                      >
                        <option value="graduate">Graduate</option>
                        <option value="undergraduate">Undergraduate</option>
                      </select>
                    </div>
                  ) : (
                    <div className="pr-field">
                      <label className="pr-label">Specialization</label>
                      <input
                        className="pr-input"
                        type="text"
                        value={draft.specialization}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, specialization: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  {!isAdmin ? (
                    <div className="pr-field">
                      <label className="pr-label">Year</label>
                      <input
                        className="pr-input"
                        type="number"
                        min="1"
                        step="1"
                        value={draft.year}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, year: e.target.value }))
                        }
                      />
                    </div>
                  ) : null}

                  {!isAdmin ? (
                    <div className="pr-field">
                      <label className="pr-label">Semester</label>
                      <input
                        className="pr-input"
                        type="number"
                        min="1"
                        step="1"
                        value={draft.semester}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, semester: e.target.value }))
                        }
                      />
                    </div>
                  ) : null}

                  <div className="pr-field" style={{ gridColumn: "1 / -1" }}>
                    <label className="pr-label">New password (optional)</label>
                    <input
                      className="pr-input"
                      type="password"
                      value={draft.password}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, password: e.target.value }))
                      }
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>

                <div className="pr-actions pr-actions-row">
                  <button
                    type="button"
                    className="pr-secondary-btn"
                    onClick={() => {
                      setSaveError("");
                      setEditMode(false);
                      clearAvatarSelection();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pr-primary-btn" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        </div>

        {/* Study Activity Tracker Section */}
        <div className="pr-activity-toggle-section">
          <div className="pr-activity-toggle-header">
            <h3 className="pr-activity-toggle-title">📚 My Study Activity</h3>
            <button
              type="button"
              className="pr-activity-toggle-btn"
              onClick={() => setShowActivitySection(!showActivitySection)}
            >
              {showActivitySection ? "Hide Activity" : "Show Activity"}
            </button>
          </div>
          
          {showActivitySection && (
            <>
              <div className="pr-activity-stats">
                <div className="pr-stat-item">
                  <span className="pr-stat-label">Today</span>
                  <span className="pr-stat-value">{getTodayStudyHours()}/10 hrs</span>
                </div>
                <div className="pr-stat-item">
                  <span className="pr-stat-label">This Week</span>
                  <span className="pr-stat-value">{getWeeklyProgress()} hrs</span>
                </div>
              </div>

              <div className="pr-activity-content">
                <div className="pr-daily-goal">
                  <div className="pr-goal-header">
                    <h4>🎯 Daily Goal: 10 Hours</h4>
                    <p>Mark each hour you complete successfully</p>
                  </div>
                  
                  <div className="pr-progress-bar">
                    <div 
                      className="pr-progress-fill" 
                      style={{ width: `${(getTodayStudyHours() / 10) * 100}%` }}
                    ></div>
                    <span className="pr-progress-text">{getTodayStudyHours()}/10 hours</span>
                  </div>
                </div>

                <div className="pr-hour-selector">
                  <h5>Complete Study Hours in Order:</h5>
                  <p className="pr-hour-instruction">
                    You must complete each hour in sequence (Hour 1 → Hour 2 → Hour 3...)
                  </p>
                  
                  {/* Show all hours with status */}
                  <div className="pr-hours-grid">
                    {[...Array(10)].map((_, index) => {
                      const hourNum = index + 1;
                      const isCompleted = studyHours.some(hour => 
                        hour.date === currentDate && hour.hour === hourNum
                      );
                      const isAvailable = getAvailableHours().includes(hourNum);
                      
                      return (
                        <button
                          key={hourNum}
                          onClick={() => isAvailable && markStudyHour(hourNum)}
                          className={`pr-hour-btn ${
                            isCompleted ? 'completed' : 
                            isAvailable ? 'available' : 'locked'
                          }`}
                          disabled={!isAvailable}
                        >
                          {isCompleted ? `✅ Hour ${hourNum}` : 
                           isAvailable ? `Hour ${hourNum}` : 
                           `🔒 Hour ${hourNum}`}
                        </button>
                      );
                    })}
                  </div>
                  
                  {getAvailableHours().length === 0 && (
                    <div className="pr-all-completed">
                      <p>🎉 All hours for today have been marked!</p>
                    </div>
                  )}
                </div>

                <div className="pr-completed-hours">
                  <h5>Today's Completed Hours:</h5>
                  <div className="pr-completed-list">
                    {studyHours
                      .filter(hour => hour.date === new Date().toISOString().split('T')[0])
                      .sort((a, b) => a.hour - b.hour)
                      .map(hour => (
                        <div key={hour.id} className="pr-completed-hour">
                          <span className="pr-hour-time">Hour {hour.hour}</span>
                          <span className="pr-hour-status">✅ Completed</span>
                          <span className="pr-hour-subject">{hour.subject}</span>
                        </div>
                      ))}
                    {studyHours.filter(hour => hour.date === new Date().toISOString().split('T')[0]).length === 0 && (
                      <div className="pr-no-hours">
                        <p>No study hours marked yet today. Start tracking your progress!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {showActivityModal && (
            <div className="pr-activity-modal">
              <div className="pr-activity-modal-content">
                <div className="pr-activity-modal-header">
                  <h4>✅ Mark Study Session Complete</h4>
                  <p>Confirm you've completed your study session</p>
                </div>
                
                <div className="pr-activity-modal-body">
                  <div className="pr-hour-confirmation">
                    <div className="pr-hour-details">
                      <span className="pr-hour-label">Study Session:</span>
                      <span className="pr-hour-value">Hour {selectedHour}</span>
                    </div>
                    <div className="pr-hour-details">
                      <span className="pr-hour-label">Date:</span>
                      <span className="pr-hour-value">{currentDate}</span>
                    </div>
                  </div>
                  
                  <div className="pr-achievement-preview">
                    {getTodayStudyHours() + 1 === 10 && (
                      <div className="pr-goal-achievement">
                        🏆 <strong>Daily Goal Complete!</strong> You'll reach 10 hours!
                      </div>
                    )}
                    <div className="pr-progress-update">
                      Current progress: {getTodayStudyHours()} → {getTodayStudyHours() + 1} hours
                    </div>
                  </div>
                </div>
                
                <div className="pr-activity-modal-actions">
                  <button
                    onClick={confirmStudyHour}
                    className="pr-confirm-btn"
                  >
                    ✅ Confirm Complete
                  </button>
                  <button
                    onClick={cancelStudyHour}
                    className="pr-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Crop Modal */}
        {showCropModal && (
          <div className="pr-crop-modal">
            <div className="pr-crop-modal-content">
              <div className="pr-crop-modal-body">
                <div className="pr-crop-container">
                  <div className="pr-crop-wrapper">
                    <img
                      ref={setImageRef}
                      src={avatarPreviewUrl}
                      alt="Crop preview"
                      onLoad={handleImageLoad}
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                    {crop.imageWidth && (
                      <div 
                        className="pr-crop-overlay-draggable"
                        style={{
                          left: `${(crop.x / crop.imageWidth) * crop.displayWidth}px`,
                          top: `${(crop.y / crop.imageHeight) * crop.displayHeight}px`,
                          width: `${(crop.width / crop.imageWidth) * crop.displayWidth}px`,
                          height: `${(crop.height / crop.imageHeight) * crop.displayHeight}px`
                        }}
                        onMouseDown={handleCropMouseDown}
                      >
                        <div className="pr-crop-dotted-border"></div>
                        {/* Resize handles */}
                        <div className="pr-resize-handle pr-resize-nw" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}></div>
                        <div className="pr-resize-handle pr-resize-ne" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}></div>
                        <div className="pr-resize-handle pr-resize-sw" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}></div>
                        <div className="pr-resize-handle pr-resize-se" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pr-crop-modal-actions">
                <button
                  onClick={handleCropCancel}
                  className="pr-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="pr-primary-btn"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default Profile;
