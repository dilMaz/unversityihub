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
  const [studentNumber, setStudentNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Validation functions
  const validateName = (name) => {
    // Only letters and spaces allowed
    const namePattern = /^[A-Za-z\s]+$/;
    return namePattern.test(name.trim());
  };

  const validateNIC = (nic) => {
    // 12 letters OR 9 numbers + 'v' or 'V'
    const oldNICPattern = /^\d{9}[vV]$/;
    const newNICPattern = /^[A-Za-z]{12}$/;
    return oldNICPattern.test(nic) || newNICPattern.test(nic);
  };

  const validatePhone = (phone) => {
    // Must start with 0 and be exactly 10 digits
    const phonePattern = /^0\d{9}$/;
    return phonePattern.test(phone);
  };

  const validateYear = (year) => {
    // Must be a number from 1-4
    const yearNum = Number(year);
    return !isNaN(yearNum) && yearNum >= 1 && yearNum <= 4;
  };

  const validateSemester = (semester) => {
    // Must be 1 or 2
    const semesterNum = Number(semester);
    return !isNaN(semesterNum) && (semesterNum === 1 || semesterNum === 2);
  };

  const validateStudentNumber = (studentNumber) => {
    // Must be IT/EN/BM with 8 digits
    const studentNumberPattern = /^(IT|EN|BM)\d{8}$/;
    return studentNumberPattern.test(studentNumber);
  };

  const validateStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 special character, and 1 digit
    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?=.*\d).{8,}$/;
    return strongPasswordPattern.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateName(name)) {
      setError("Invalid name. Only letters and spaces allowed.");
      return;
    }

    if (!validateNIC(nic)) {
      setError("Invalid NIC. Must be 12 letters or 9 numbers + 'v' or 'V'.");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Invalid phone number. Must start with 0 and be exactly 10 digits.");
      return;
    }

    if (!validateYear(year)) {
      setError("Invalid year. Must be a number from 1-4.");
      return;
    }

    if (!validateSemester(semester)) {
      setError("Invalid semester. Must be 1 or 2.");
      return;
    }

    if (!validateStudentNumber(studentNumber)) {
      setError("Invalid student number. Must be IT/EN/BM with 8 digits.");
      return;
    }

    if (!validateStrongPassword(password)) {
      setError("Password must be at least 8 characters, 1 uppercase, 1 lowercase, 1 special character, and 1 digit.");
      return;
    }

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
        studentNumber: studentNumber.trim(),
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
                placeholder="John Doe (letters only)"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
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
                placeholder="e.g. 123456789V or ABCDEF123456"
                value={nic}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only 12 letters OR 9 numbers + V/v
                  const lettersOnly = value.replace(/[^A-Za-z]/g, '');
                  const numbersAndV = value.replace(/[^0-9Vv]/g, '');
                  
                  if (lettersOnly.length <= 12 && value === lettersOnly) {
                    setNic(lettersOnly);
                  } else if (numbersAndV.length <= 10 && value === numbersAndV) {
                    // For old NIC format, ensure V is only at the end
                    if (numbersAndV.length === 10) {
                      const lastChar = numbersAndV[9];
                      if (lastChar === 'V' || lastChar === 'v') {
                        setNic(numbersAndV);
                      }
                    } else if (numbersAndV.length <= 9) {
                      setNic(numbersAndV);
                    }
                  } else if (value.length < nic.length) {
                    // Allow backspace
                    setNic(value);
                  }
                }}
                maxLength={12}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Phone (optional)</label>
              <input
                className="reg-input"
                type="tel"
                placeholder="e.g. 0771234567"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  // Only allow up to 10 digits
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                maxLength={10}
              />
            </div>

            <div className="reg-field reg-span-2">
              <label className="reg-label">Password</label>
              <input
                className="reg-input"
                type="password"
                placeholder="Min 8 chars: 1 uppercase, 1 lowercase, 1 special, 1 digit"
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
              <label className="reg-label">Student Number</label>
              <input
                className="reg-input"
                type="text"
                placeholder="e.g. IT12345678"
                value={studentNumber}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Allow IT/EN/BM followed by numbers
                  const validPrefix = ['IT', 'EN', 'BM'];
                  const prefix = value.slice(0, 2);
                  const numbers = value.slice(2);
                  
                  if (validPrefix.includes(prefix) && numbers.length <= 8) {
                    setStudentNumber(prefix + numbers.replace(/[^0-9]/g, ''));
                  } else if (prefix.length === 1 && validPrefix.some(p => p.startsWith(prefix))) {
                    setStudentNumber(prefix);
                  } else if (value.length < studentNumber.length) {
                    // Allow backspace
                    setStudentNumber(value);
                  }
                }}
                maxLength={10}
                required
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
                placeholder="Year (1-4)"
                value={year}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^1-4]/g, '');
                  // Only allow single digit 1-4
                  if (value.length <= 1) {
                    setYear(value);
                  }
                }}
                min="1"
                max="4"
                maxLength={1}
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Semester</label>
              <input
                className="reg-input"
                type="number"
                placeholder="Semester (1-2)"
                value={semester}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^1-2]/g, '');
                  // Only allow single digit 1-2
                  if (value.length <= 1) {
                    setSemester(value);
                  }
                }}
                min="1"
                max="2"
                maxLength={1}
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