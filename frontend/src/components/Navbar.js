import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const [showPrograms, setShowPrograms] = useState(false);

  return (
    <div className="nav-container">
      <div className="nav-logo">SLIIT Hub</div>

      <div className="nav-links">
        <Link to="/">Home</Link>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setShowPrograms(true)}
          onMouseLeave={() => setShowPrograms(false)}
        >
          <span>Programs ▾</span>

          {showPrograms && (
            <div className="dropdown-menu">
              {/* ✅ go to programs page FIRST */}
              <Link to="/programs">Computing</Link>
            </div>
          )}
        </div>

        <Link to="/search">Search</Link>
        <Link to="/recommend">Recommended</Link>
      </div>

      <div className="nav-actions">
        <button className="upload-btn">Upload Note</button>
        <Link to="/login" className="login-btn">Login</Link>
      </div>
    </div>
  );
};

export default Navbar;