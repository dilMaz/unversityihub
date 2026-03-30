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
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [imageRef, setImageRef] = useState(null);

  const [draft, setDraft] = useState({
    name: "",
    email: "",
    nic: "",
    status: "undergraduate",
    itNumber: "",
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
      setProfile(res.data || {});
    } catch (e) {
      setError(
        e?.response?.data?.message || "Unable to load your profile."
      );
      setProfile(null);
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
      itNumber: profile?.itNumber || "",
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
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
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

  const handleAvatarClick = () => {
    document.getElementById('avatar-upload-input').click();
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
        payload.itNumber = draft.itNumber.trim();
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
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
            <div className="pr-user-info">
              <h1>
                {profile?.name ? profile.name : "Loading…"}
              </h1>
              <div className="pr-user-meta">
                <span className="pr-user-email">{profile?.email || "loading@email.com"}</span>
                <span className="pr-user-id">ID: {profile?.itNumber || "Loading..."}</span>
              </div>
            </div>
          </div>
          <p className="pr-hero-description">Manage your academic profile and personal information</p>

          {showCropModal && (
            <div className="pr-crop-modal">
              <div className="pr-crop-modal-content">
                <div className="pr-crop-modal-header">
                  <h3>Crop Profile Picture</h3>
                  <button type="button" className="pr-crop-modal-close" onClick={handleCropCancel}>×</button>
                </div>
                <div className="pr-crop-modal-body">
                  <ReactCrop
                    crop={crop}
                    onChange={setCrop}
                    aspect={1}
                    minWidth={100}
                    minHeight={100}
                    keepSelection
                  >
                    <img
                      ref={setImageRef}
                      src={avatarPreviewUrl}
                      alt="Upload preview"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </ReactCrop>
                </div>
                <div className="pr-crop-modal-footer">
                  <button type="button" className="pr-secondary-btn" onClick={handleCropCancel}>Cancel</button>
                  <button type="button" className="pr-primary-btn" onClick={handleCropConfirm}>Apply</button>
                </div>
              </div>
            </div>
          )}

          {editMode ? (
            <div className="pr-avatar-upload">
              <label className="pr-avatar-upload-btn">
                Choose profile picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      clearAvatarSelection();
                      return;
                    }
                    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                    setAvatarFile(file);
                    setAvatarPreviewUrl(URL.createObjectURL(file));
                  }}
                />
              </label>
              <div className="pr-avatar-upload-hint">PNG/JPG preferred. Up to 3MB.</div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="pr-loading-state">
            <div className="pr-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        ) : error ? (
          <div className="pr-error-state">
            <div className="pr-error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3>Unable to Load Profile</h3>
            <p>{error}</p>
            <button className="pr-retry-btn" onClick={loadProfile}>
              Try Again
            </button>
          </div>
        ) : (
          <div>
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
                      <div className="pr-label">IT number</div>
                      <div className="pr-value">{v(profile?.itNumber)}</div>
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
                      <label className="pr-label">IT number</label>
                      <input
                        className="pr-input"
                        type="text"
                        value={draft.itNumber}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, itNumber: e.target.value }))
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
    </div>
  );
}

export default Profile;

