import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/dashboard.css';

const AdminPanel = () => {
  const navigate = useNavigate();
const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    status: 'active',
    phone: '',
    password: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Name must contain only letters';
        break;
      case 'nic':
        if (!/^[0-9]{12}V$/i.test(value)) error = 'NIC must be exactly 12 digits + V';
        break;
      case 'email':
        if (!/.+@.+\..+/.test(value)) error = 'Email must include @ and domain';
        break;
      case 'phone':
        if (!/^[\+]?[0-9\s\-\(\)]{10}$/.test(value)) error = 'Phone must be exactly 10 numbers with optional + () - spaces';
        break;
      case 'password':
        if (value.length < 6) error = 'Password must be at least 6 characters';
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

    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'confirmPassword') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage('Please fix errors below');
      return;
    }



    setLoading(true);
    setMessage('');
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/auth/register', {
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

      setMessage('New Admin registered successfully!');
      setFormData({ name: '', nic: '', email: '', status: 'active', phone: '', password: '', confirmPassword: '' });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Admin Register</div>
          <button className="db-admin-btn" onClick={() => navigate('/admin-dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Register New Admin</div>
          <h1>Create <span>New Admin Account</span></h1>
          <p>Add a new admin user to manage the system.</p>
        </div>

        <div style={{ marginTop: '40px' }}>
          <div className="db-section-title">Admin Registration Form</div>
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
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
                  Admin Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => {
                    const error = validateField('name', formData.name);
                    setErrors(prev => ({...prev, name: error}));
                  }}
                  required
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    border: errors.name ? '2px solid #ef4444' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                />
                {errors.name && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  NIC Number (xxxxxxxxxxV)
                </label>
                <input
                  name="nic"
                  type="text"
                  maxLength="13"
                  value={formData.nic}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9V]/g, '').toUpperCase().slice(0,13);
                    setFormData({
                      ...formData,
                      nic: value
                    });
                    const error = validateField('nic', value);
                    setErrors(prev => ({...prev, nic: error}));
                  }}
                  onBlur={() => {
                    const error = validateField('nic', formData.nic);
                    setErrors(prev => ({...prev, nic: error}));
                  }}
                  required
                  placeholder="9412345678V"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    border: errors.nic ? '2px solid #ef4444' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    textTransform: 'uppercase'
                  }}
                />
                {errors.nic && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {errors.nic}
                  </div>
                )}
              </div>

              <div>
                <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@university.edu"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Phone Number (10 digits)
                </label>
                <input
                  name="phone"
                  type="tel"
                  maxLength="15"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\+0-9\s\-\(\)]/g, '').slice(0,15);
                    handleChange({target: {name: 'phone', value}});
                  }}
                  onBlur={() => {
                    const error = validateField('phone', formData.phone);
                    setErrors(prev => ({...prev, phone: error}));
                  }}
                  required
                  placeholder="0771234567 or +94771234567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    border: errors.phone ? '2px solid #ef4444' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                />
                {errors.phone && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {errors.phone}
                  </div>
                )}
              </div>

              <div>
                <label style={{ color: 'var(--text)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Current Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    border: errors.status ? '2px solid #ef4444' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                >
                  <option value="graduate">Graduate</option>
                  <option value="undergraduate">Undergraduate</option>
                </select>
                {errors.status && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {errors.status}
                  </div>
                )}
              </div>



              {message && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  fontWeight: '500',
                  ...(message.includes('successfully') ? { 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    color: '#22c55e',
                    border: '1px solid #22c55e' 
                  } : { 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444',
                    border: '1px solid #ef4444' 
                  })
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(90deg, #7c5cfc, #e05fff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating Admin...' : 'Create New Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
