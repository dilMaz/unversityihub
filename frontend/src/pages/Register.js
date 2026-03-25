import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [itNumber, setItNumber] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [phone, setPhone] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [specialization, setSpecialization] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [year, setYear] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [semester, setSemester] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name,
        email,
        password,
      };

      if (itNumber) payload.itNumber = itNumber.trim();
      if (phone) payload.phone = phone.trim();
      if (specialization) payload.specialization = specialization.trim();
      if (year !== "") payload.year = Number(year);
      if (semester !== "") payload.semester = Number(semester);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        payload
      );

      console.log("REGISTER SUCCESS:", res.data);

      alert("Registration Successful ✅");

      // 🔥 REDIRECT TO LOGIN
      navigate("/login");

    } catch (err) {
      console.log(err);
      alert("Registration Failed ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleRegister}>
          <div className="reg-grid">
            <div className="reg-field">
              <label className="reg-label">Name</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Enter Name"
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="reg-field reg-span-2">
              <label className="reg-label">Password</label>
              <input
                className="reg-input"
                type="password"
                placeholder="Enter Password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">IT number (optional)</label>
              <input
                className="reg-input"
                type="text"
                placeholder="e.g. IT2020"
                onChange={(e) => setItNumber(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Phone number (optional)</label>
              <input
                className="reg-input"
                type="tel"
                placeholder="e.g. 0771234567"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="reg-field reg-span-2">
              <label className="reg-label">Specialization (optional)</label>
              <input
                className="reg-input"
                type="text"
                placeholder="e.g. Computer Science"
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Year (optional)</label>
              <input
                className="reg-input"
                type="number"
                placeholder="e.g. 2"
                min="1"
                step="1"
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Semester (optional)</label>
              <input
                className="reg-input"
                type="number"
                placeholder="e.g. 1"
                min="1"
                step="1"
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
          </div>

          <button className="reg-submit" type="submit">
            Register
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