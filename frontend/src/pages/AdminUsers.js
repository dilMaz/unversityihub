import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const confirmDeletion = window.confirm("Are you sure you want to delete this user?");
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
          <div className="db-logo">Admin - Users</div>
          <button className="db-logout" onClick={backHome}>
            ← Back to Admin
          </button>
        </div>

        <div className="db-hero">
          <div className="db-greeting">User Management</div>
          <h1>All Registered Users</h1>
          <p>Below are the users from MongoDB.</p>
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
