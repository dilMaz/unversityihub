import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    siteName: 'University Hub',
    maintenanceMode: false,
    maxUploadSize: '50MB',
    notificationsEnabled: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Settings</div>
          <button className="db-admin-btn" onClick={() => navigate('/admin-dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">System Configuration</div>
          <h1>Admin <span>Settings Panel</span></h1>
          <p>Configure system-wide preferences and admin options.</p>
        </div>

        <div style={{ marginTop: '40px' }}>
          <div className="db-section-title">General Settings</div>
          
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            display: 'grid',
            gap: '20px'
          }}>
            <div>
              <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Max Upload Size
              </label>
              <input
                type="text"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text)', fontWeight: '600' }}>
                Maintenance Mode
              </label>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle('maintenanceMode')}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text)', fontWeight: '600' }}>
                Enable Notifications
              </label>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={() => handleToggle('notificationsEnabled')}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg, #7c5cfc, #e05fff)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                marginTop: '10px'
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
