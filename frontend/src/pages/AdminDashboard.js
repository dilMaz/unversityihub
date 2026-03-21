import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        setUsersError(err?.response?.data?.message || "Unable to fetch users");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchDashboard();
    fetchUsers();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const backToDashboard = () => {
    navigate("/dashboard");
  };

  const goToUsers = () => {
    navigate("/admin-users");
  };

  return (
    <div className="db-root">
      <div className="db-wrap">

        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-logo">Admin Panel</div>
          <div className="db-topbar-actions">

            <button className="db-logout" onClick={logout}>
              <span>↩</span> Sign out
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="db-hero">
          <div className="db-greeting">Admin Dashboard</div>
          <h1>
            {loading
              ? <span className="db-skeleton" />
              : <>Welcome Admin, <span>{name}</span></>
            }
          </h1>
          <p>Manage your application and user data.</p>
        </div>

        {/* Admin Features */}
        <div className="db-section-title">Admin Features</div>
        <div className="db-cards">
          <div className="db-card c1">
            <div className="db-card-glow" />
            <div className="db-card-icon">📊</div>
            <div>
              <div className="db-card-title">User Management</div>
              <div className="db-card-desc">View and manage all users in the system.</div>
            </div>
            <button className="db-card-btn" onClick={goToUsers}>
              View Users <span className="db-card-arrow">→</span>
            </button>
          </div>

          <div className="db-card c2">
            <div className="db-card-glow" />
            <div className="db-card-icon">📝</div>
            <div>
              <div className="db-card-title">Document Review</div>
              <div className="db-card-desc">Review and approve pending documents.</div>
            </div>
            <button className="db-card-btn">
              Review Docs <span className="db-card-arrow">→</span>
            </button>
          </div>

          <div className="db-card c3">
            <div className="db-card-glow" />
            <div className="db-card-icon">📈</div>
            <div>
              <div className="db-card-title">Analytics</div>
              <div className="db-card-desc">View system statistics and analytics.</div>
            </div>
            <button className="db-card-btn">
              View Analytics <span className="db-card-arrow">→</span>
            </button>
          </div>

          <div className="db-card c4">
            <div className="db-card-glow" />
            <div className="db-card-icon">⬆️</div>
            <div>
              <div className="db-card-title">Upload Notes</div>
              <div className="db-card-desc">Manage and approve note uploads from users.</div>
            </div>
            <button className="db-card-btn" onClick={() => navigate('/admin-upload-notes')}>
              Manage Uploads <span className="db-card-arrow">→</span>
            </button>
          </div>

          <div className="db-card c5">
            <div className="db-card-glow" />
            <div className="db-card-icon">💬</div>
            <div>
              <div className="db-card-title">Comment Management</div>
              <div className="db-card-desc">Review and moderate comments on notes.</div>
            </div>
            <button className="db-card-btn" onClick={() => navigate('/admin-comments')}>
              Review Comments <span className="db-card-arrow">→</span>
            </button>
          </div>

          {/* Register Admin Card */}


          <div className="db-card c7">

            <div className="db-card-glow" />
            <div className="db-card-icon">🎓</div>
            <div>
              <div className="db-card-title">Student Support</div>
              <div className="db-card-desc">Manage student inquiries and support requests.</div>
            </div>
            <button className="db-card-btn" onClick={() => navigate('/admin-student-support')}>
              View Requests <span className="db-card-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Removed inline user table; navigation to AdminUsers page now handles user listing. */}

      </div>
    </div>
  );
}

export default AdminDashboard;
