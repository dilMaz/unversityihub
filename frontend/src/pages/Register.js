import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Register() {
  // Core user state
  const [name, setName] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("undergraduate");
  
  // Additional student fields
  const [itNumber, setItNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  // UI state
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
      // Build the payload with all available fields
      const payload = {
        name,
        nic: nic || 'N/A',
        email,
        password,
        phone: phone || 'N/A',
        status,
        itNumber: itNumber.trim(),
        specialization: specialization.trim(),
        year: year !== "" ? Number(year) : null,
        semester: semester !== "" ? Number(semester) : null,
      };

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        payload
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
        <div className="auth-header">
          <span 
            className="auth-back-btn" 
            onClick={() => navigate("/login")}
            aria-label="Go back to login"
            role="button"
            tabIndex="0"
          >
            ←
          </span>
          <div className="auth-brand">
            <div className="auth-brand-name">UniHub</div>
          </div>
        </div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Start sharing and discovering smarter notes</p>

        {error && (
          <div className="error-msg" style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="reg-grid">
            {/* Basic Info */}
            <div className="reg-field">
              <label className="reg-label">Full Name</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Email</label>
              <input
                className="reg-input"
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">NIC (optional)</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Enter NIC"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Phone (optional)</label>
              <input
                className="reg-input"
                type="tel"
                placeholder="e.g. 0771234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="reg-field reg-span-2">
              <label className="reg-label">Password</label>
              <input
                className="reg-input"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Academic Info */}
            <div className="reg-field">
              <label className="reg-label">Status</label>
              <select 
                className="reg-input" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>

            <div className="reg-field">
              <label className="reg-label">IT Number</label>
              <input
                className="reg-input"
                type="text"
                placeholder="e.g. IT2020"
                value={itNumber}
                onChange={(e) => setItNumber(e.target.value)}
              />
            </div>

            <div className="reg-field reg-span-2">
              <label className="reg-label">Specialization</label>
              <input
                className="reg-input"
                type="text"
                placeholder="e.g. Software Engineering"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Year</label>
              <input
                className="reg-input"
                type="number"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Semester</label>
              <input
                className="reg-input"
                type="number"
                placeholder="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
          </div>

          <button className="reg-submit" type="submit" disabled={loading}>
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