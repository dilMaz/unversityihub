import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/admin-login", // Assuming you have an admin login endpoint
        {
          email,
          password,
        }
      );

      console.log("ADMIN LOGIN DATA:", res.data);

      // 🔥 SAVE TOKEN + USER
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/admin-dashboard"); // Navigate to admin dashboard

    } catch (err) {
      alert("Invalid Admin Email or Password ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Login to UniNotes</h2>

        <form onSubmit={handleAdminLogin}>
          <input
            type="email"
            placeholder="Enter Admin Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Admin Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Admin Login</button>
        </form>

        <div className="auth-link">
          Back to <Link to="/login">User Login</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;