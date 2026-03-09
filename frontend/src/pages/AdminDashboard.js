import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    // Temporarily disabled auth check for demo
    /*
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    setUser(parsedUser);
    */
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="admin-profile">
          <div className="round-image"></div>
          <p>{user ? user.name : 'Admin Name'}</p>
        </div>
        <h3>Admin Menu</h3>
        <button onClick={() => setActiveTab('users')}>👥 Manage Users</button>
        <button onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
        <button onClick={() => setActiveTab('approve')}>📝 Admin Approve</button>
        <button onClick={() => setActiveTab('settings')}>⚙️ System Settings</button>
        <button onClick={() => setActiveTab('reports')}>📧 Reports</button>
        <button onClick={() => navigate("/dashboard")}>🔙 User Dashboard</button>
        <button onClick={logout}>🚪 Logout</button>
      </div>
      <div className="main-content">
        {activeTab === 'users' && (
          <div>
            <h2>Manage Users</h2>
            <p>Here you can view and manage all users.</p>
            {/* Add user list or form here */}
          </div>
        )}
        {activeTab === 'analytics' && (
          <div>
            <h2>Analytics</h2>
            <p>View platform statistics and analytics.</p>
            {/* Add charts or stats here */}
          </div>
        )}
        {activeTab === 'approve' && (
          <div>
            <h2>Admin Approve</h2>
            <p>Approve or reject uploaded notes.</p>
            {/* Add approval interface here */}
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h2>System Settings</h2>
            <p>Configure system settings.</p>
            {/* Add settings form here */}
          </div>
        )}
        {activeTab === 'reports' && (
          <div>
            <h2>Reports</h2>
            <p>View and generate reports.</p>
            {/* Add reports here */}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;