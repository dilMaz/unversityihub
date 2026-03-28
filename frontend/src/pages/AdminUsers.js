import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const onlyAdmins = (queryParams.get("role") || "").toLowerCase() === "admin";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const backHome = () => {
    navigate("/admin-dashboard");
  };

  const deleteUser = async (userId) => {
    const confirmDeletion = window.confirm(`Are you sure you want to delete this ${onlyAdmins ? "admin" : "user"}?`);
    if (!confirmDeletion) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <div className="db-root">
      <div className="db-wrap">
        <div className="db-topbar">
          <div className="db-logo">{onlyAdmins ? "Admin - All Admins" : "Admin - Users"}</div>
          <button className="db-logout" onClick={backHome}>
            ← Back to Admin
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">{onlyAdmins ? "Admin Accounts" : "User Management"}</div>
          <h1>{onlyAdmins ? "All Admin Accounts" : "All Registered Users"}</h1>
          <p>{onlyAdmins ? "Below are admin accounts from MongoDB." : "Below are the users from MongoDB."}</p>
        </div>

        <div className="user-table-wrap">
          {loading ? (
            <p>Loading users...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => !onlyAdmins || (user.role || "").toLowerCase() === "admin")
                  .filter((user) => user && user._id)
                  .map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <button className="db-admin-btn" onClick={() => deleteUser(user._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
