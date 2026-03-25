import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Register() {
  const [name, setName] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("undergraduate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        { 
          name, 
          nic: nic || 'N/A', 
          email, 
          password, 
          phone: phone || 'N/A', 
          status 
        }
      );

      console.log("REGISTER SUCCESS:", res.data);

      navigate("/login");

    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">UniHub</div>
        </div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Start sharing and discovering smarter notes</p>

        {error && (
          <div className="error-msg" style={{color: 'red', marginBottom: '1rem', padding: '0.5rem'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label className="auth-label">Full Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="auth-label">Email</label>
          <input
            type="text"
            placeholder="NIC (optional)"
            onChange={(e) => setNic(e.target.value)}
          />

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label">Password</label>
          <input
            type="tel"
            placeholder="Phone (optional)"
            onChange={(e) => setPhone(e.target.value)}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
          </select>

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;