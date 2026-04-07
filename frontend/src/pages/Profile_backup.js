import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load your profile.");
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
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
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

  const handleAvatarClick = () => {
    document.getElementById('avatar-upload-input').click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      clearAvatarSelection();
      return;
    }
    
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
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
              <div className="pr-user-info">
                <h1>{v(profile?.name)}</h1>
                <span className="pr-user-id">ID: {v(profile?.itNumber)}</span>
              </div>
            </div>
            <div className="pr-hero-actions">
              {!editMode ? (
                <button
                  type="button"
                  className="pr-edit-btn"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="pr-edit-actions">
                  <button
                    type="button"
                    className="pr-cancel-btn"
                    onClick={() => {
                      setEditMode(false);
                      clearAvatarSelection();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="pr-save-btn"
                    onClick={onSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pr-loading">
            <div className="pr-spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="pr-error">
            <p>{error}</p>
            <button onClick={loadProfile} className="pr-retry-btn">
              Try Again
            </button>
          </div>
        ) : (
          <div className="pr-content-wrapper">
            <div className="pr-card">
              <div className="pr-card-header">
                <h2>Profile Information</h2>
              </div>
              <div className="pr-card-body">
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
            </div>

            {editMode && (
              <div className="pr-card">
                <div className="pr-card-header">
                  <h2>Edit Profile</h2>
                </div>
                <div className="pr-card-body">
                  {saveError && (
                    <div className="pr-error-message">{saveError}</div>
                  )}
                  <div className="pr-field">
                    <label className="pr-label">Name</label>
                    <input
                      className="pr-input"
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
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
                    />
                  </div>
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
                    <>
                      <div className="pr-field">
                        <label className="pr-label">NIC</label>
                        <input
                          className="pr-input"
                          type="text"
                          value={draft.nic}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, nic: e.target.value }))
                          }
                        />
                      </div>
                      <div className="pr-field">
                        <label className="pr-label">Status</label>
                        <select
                          className="pr-select"
                          value={draft.status}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, status: e.target.value }))
                          }
                        >
                          <option value="undergraduate">Undergraduate</option>
                          <option value="graduate">Graduate</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
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
                      <div className="pr-field">
                        <label className="pr-label">Year</label>
                        <input
                          className="pr-input"
                          type="number"
                          value={draft.year}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, year: e.target.value }))
                          }
                        />
                      </div>
                      <div className="pr-field">
                        <label className="pr-label">Semester</label>
                        <input
                          className="pr-input"
                          type="number"
                          value={draft.semester}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, semester: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="pr-field">
                    <label className="pr-label">New Password (optional)</label>
                    <input
                      className="pr-input"
                      type="password"
                      value={draft.password}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, password: e.target.value }))
                      }
                      placeholder="Leave empty to keep current password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
