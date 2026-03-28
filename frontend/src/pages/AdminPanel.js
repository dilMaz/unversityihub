import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/dashboard.css';
import '../styles/adminPanel.css';

const normalizeNicInput = (value) => {
  const upper = (value || '').toUpperCase().replace(/\s+/g, '');
  const filtered = upper.replace(/[^0-9V]/g, '');
  const digits = filtered.replace(/V/g, '');

  if (filtered.includes('V')) {
    return `${digits.slice(0, 9)}V`;
  }

  return digits.slice(0, 12);
};

const isValidSriLankanNic = (value) => /^(?:\d{12}|\d{9}V)$/.test((value || '').toUpperCase());

const AdminPanel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    status: 'undergraduate',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState('');
  const [editingAdminId, setEditingAdminId] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'undergraduate',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchAdminUsers = async (showLoading = true) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdminsLoading(false);
      setAdminsError('Missing auth token');
      return;
    }

    try {
      if (showLoading) setAdminsLoading(true);
      setAdminsError('');
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = Array.isArray(res.data) ? res.data : [];
      setAdminUsers(users.filter((u) => (u.role || '').toLowerCase() === 'admin'));
    } catch (err) {
      setAdminsError(err.response?.data?.message || 'Failed to load admin users');
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const startEditAdmin = (admin) => {
    setEditingAdminId(admin._id);
    setEditForm({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      status: admin.status || 'undergraduate',
    });
    setMessage('');
  };

  const cancelEditAdmin = () => {
    setEditingAdminId('');
    setEditForm({
      name: '',
      email: '',
      phone: '',
      status: 'undergraduate',
    });
  };

  const saveEditAdmin = async (adminId) => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage('Name and email are required to update admin details');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Missing auth token');
      return;
    }

    try {
      setSavingEdit(true);
      setMessage('');

      await axios.put(
        `http://localhost:5000/api/admin/users/${adminId}`,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          status: editForm.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage('Admin details updated successfully! ✅');
      cancelEditAdmin();
      fetchAdminUsers(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update admin details');
    } finally {
      setSavingEdit(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Name must contain only letters';
        break;
      case 'nic':
        if (!isValidSriLankanNic(value)) {
          error = 'NIC must be 12 digits or 9 digits followed by V';
        }
        break;
      case 'email':
        if (!/.+@.+\..+/.test(value)) error = 'Email must include @ and domain';
        break;
      case 'phone':
        if (!/^[0-9]{10}$/.test(value.replace(/[\s\-()]/g, ''))) error = 'Phone must have exactly 10 numbers';
        break;
      case 'password':
        if (value.length < 8 || value.length > 12) {
          error = 'Password must be 8-12 characters';
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(value)) {
          error = 'Must include uppercase/lowercase, numbers, symbols';
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        nic: formData.nic,
        email: formData.email,
        password: formData.password,
        role: 'admin',
        status: formData.status,
        phone: formData.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('New Admin registered successfully! ✅');
      setFormData({ name: '', nic: '', email: '', status: 'undergraduate', phone: '', password: '', confirmPassword: '' });
      fetchAdminUsers(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-root admin-panel-page">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Register</div>
          <button className="db-admin-btn" onClick={() => navigate('/admin-dashboard')} >
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Register New Admin</div>
          <h1>Create <span>New Admin Account</span></h1>
          <p>Add a new admin user to manage the system.</p>
        </div>

        <div className="ap-layout">
          <div>
          <div className="db-section-title">Admin Registration Form</div>
          
          <form onSubmit={handleSubmit} className="ap-form-card">
            <div className="ap-form-grid">
              <div className="ap-field">
                <label className="ap-label">
                  Admin Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className={`ap-input ${errors.name ? 'ap-input-error' : ''}`}
                />
                {errors.name && <div className="ap-error">{errors.name}</div>}
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  NIC Number
                </label>
                <input
                  name="nic"
                  type="text"
                  maxLength="12"
                  value={formData.nic}
                  onChange={(e) => {
                    const value = normalizeNicInput(e.target.value);
                    setFormData({
                      ...formData,
                      nic: value
                    });

                    const error = validateField('nic', value);
                    setErrors((prev) => ({
                      ...prev,
                      nic: error,
                    }));
                  }}
                  required
                  placeholder="200123456789 or 123456789V"
                  className={`ap-input ${errors.nic ? 'ap-input-error' : ''}`}
                />
                {errors.nic && <div className="ap-error">{errors.nic}</div>}
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@university.edu"
                  className={`ap-input ${errors.email ? 'ap-input-error' : ''}`}
                />
                {errors.email && <div className="ap-error">{errors.email}</div>}
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  Phone Number (10 digits)
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="0771234567"
                  className={`ap-input ${errors.phone ? 'ap-input-error' : ''}`}
                />
                {errors.phone && <div className="ap-error">{errors.phone}</div>}
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  Academic Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`ap-input ${errors.status ? 'ap-input-error' : ''}`}
                >
                  <option value="graduate">Graduate</option>
                  <option value="undergraduate">Undergraduate</option>
                </select>
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  Password
                </label>
                <div className="ap-password-wrap">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter strong password"
                    className={`ap-input ap-password-input ${errors.password ? 'ap-input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ap-eye-btn"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <div className="ap-error">{errors.password}</div>}
              </div>

              <div className="ap-field">
                <label className="ap-label">
                  Confirm Password
                </label>
                <div className="ap-password-wrap">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                    className="ap-input ap-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ap-eye-btn"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`ap-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="ap-submit-btn"
              >
                {loading ? 'Creating Admin...' : 'Register New Admin'}
              </button>
            </div>
          </form>
          </div>

          <div>
            <div className="db-section-title">All Admin Accounts</div>
            <div className="user-table-wrap">
              {adminsLoading ? (
                <p>Loading admin users...</p>
              ) : adminsError ? (
                <p className="error-text">{adminsError}</p>
              ) : adminUsers.length === 0 ? (
                <p>No admin accounts found.</p>
              ) : (
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((admin) => (
                      <tr key={admin._id}>
                        <td>
                          {editingAdminId === admin._id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="ap-table-input"
                            />
                          ) : (
                            admin.name
                          )}
                        </td>
                        <td>
                          {editingAdminId === admin._id ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                              className="ap-table-input"
                            />
                          ) : (
                            admin.email
                          )}
                        </td>
                        <td>
                          {editingAdminId === admin._id ? (
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                              className="ap-table-input"
                            />
                          ) : (
                            admin.phone || '-'
                          )}
                        </td>
                        <td>
                          {editingAdminId === admin._id ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                              className="ap-table-input"
                            >
                              <option value="undergraduate">Undergraduate</option>
                              <option value="graduate">Graduate</option>
                            </select>
                          ) : (
                            admin.status || '-'
                          )}
                        </td>
                        <td><span className="ap-role-chip">admin</span></td>
                        <td>
                          {editingAdminId === admin._id ? (
                            <div className="ap-actions">
                              <button
                                type="button"
                                className="db-admin-btn"
                                onClick={() => saveEditAdmin(admin._id)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="db-logout"
                                onClick={cancelEditAdmin}
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="db-admin-btn"
                              onClick={() => startEditAdmin(admin)}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
