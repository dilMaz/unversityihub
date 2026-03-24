import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const StudentSupport = () => {
  const navigate = useNavigate();
  const [supportRequests] = useState([]);

  const handleResolve = (id) => {
    alert(`Request ${id} marked as resolved!`);
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">Student Support</div>
          <button className="db-admin-btn" onClick={() => navigate('/admin-dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">Support Management</div>
          <h1>Student <span>Support Requests</span></h1>
          <p>Review and manage student inquiries and support tickets.</p>
        </div>

        <div style={{ marginTop: '40px' }}>
          <div className="db-section-title">Active Support Requests</div>
          
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: 'var(--text)'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {supportRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: '600' }}>{req.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{req.email}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: '500' }}>{req.subject}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{req.message}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: req.status === 'pending' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                        color: req.status === 'pending' ? '#ffc107' : '#4caf50',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                      {req.date}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleResolve(req.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(76, 175, 80, 0.2)',
                            color: '#4caf50',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}
                        >
                          Resolve
                        </button>
                      )}
                      {req.status === 'resolved' && (
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>✓ Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSupport;
