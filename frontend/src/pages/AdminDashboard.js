import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // ✅ Fix 1 — role check කරන්න — admin නොවෙනම් dashboard එකට
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.role?.toLowerCase() !== "admin") {
      navigate("/dashboard");
      return;
    }

    // ✅ Fix 2 — localStorage user data use කරන්න
    if (storedUser?.name) {
      setName(storedUser.name);
      setLoading(false);
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // ✅ Fix 3 — 401 එකට විතරක් token delete කරන්න
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
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
    localStorage.removeItem("user"); // ✅ Fix 4 — user ද delete කරන්න
    navigate("/login");
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
            <button className="db-card-btn" onClick={() => navigate('/admin-users')}>
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
            <button className="db-card-btn" onClick={() => navigate('/admin-review')}>
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

          <div className="db-card c6">
            <div className="db-card-glow" />
            <div className="db-card-icon">👨‍💼</div>
            <div>
              <div className="db-card-title">Admin Registration</div>
              <div className="db-card-desc">Register new admin users for the system.</div>
            </div>
            <button className="db-card-btn" onClick={() => navigate('/admin-panel')}>
              Register Admin <span className="db-card-arrow">→</span>
            </button>
          </div>

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

      </div>
    </div>
  );
}

export default AdminDashboard;