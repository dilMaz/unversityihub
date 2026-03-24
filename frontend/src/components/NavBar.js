import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const hideOnGuestAuth = !isLoggedIn && (location.pathname === "/login" || location.pathname === "/register");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    const storedUser = localStorage.getItem("user");
    let resolvedRole = storedRole || "user";

    if (!storedRole && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        resolvedRole = parsedUser?.role || "user";
      } catch (err) {
        resolvedRole = "user";
      }
    }

    setIsLoggedIn(!!token);
    setUserRole(resolvedRole);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/login");
    setMobileOpen(false);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleFeaturesClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const target = document.getElementById("features");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      const target = document.getElementById("features");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  if (hideOnGuestAuth) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => handleNavClick(isLoggedIn ? "/dashboard" : "/")}>
          <span className="logo-icon">📚</span>
          <span className="logo-text">UniHub</span>
        </div>

        {/* Hamburger Menu */}
        <button
          className="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menu */}
        <ul className={`nav-menu ${mobileOpen ? "active" : ""}`}>
          {isLoggedIn ? (
            <>
              {/* User Links */}
              <li>
                <button
                  className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                  onClick={() => handleNavClick("/dashboard")}
                >
                  🏠 Dashboard
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${isActive("/search") ? "active" : ""}`}
                  onClick={() => handleNavClick("/search")}
                >
                  🔍 Search
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${isActive("/top-rated") ? "active" : ""}`}
                  onClick={() => handleNavClick("/top-rated")}
                >
                  ⭐ Top Rated
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${isActive("/recommend") ? "active" : ""}`}
                  onClick={() => handleNavClick("/recommend")}
                >
                  🤖 Recommended
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${isActive("/upload") ? "active" : ""}`}
                  onClick={() => handleNavClick("/upload")}
                >
                  📤 Upload
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${isActive("/categories") ? "active" : ""}`}
                  onClick={() => handleNavClick("/categories")}
                >
                  📂 Categories
                </button>
              </li>

              {/* Admin Links */}
              {userRole === "admin" && (
                <>
                  <li className="nav-divider"></li>
                  <li>
                    <button
                      className={`nav-link admin ${isActive("/admin-dashboard") ? "active" : ""}`}
                      onClick={() => handleNavClick("/admin-dashboard")}
                    >
                      ⚙️ Admin
                    </button>
                  </li>
                </>
              )}

              {/* Logout */}
              <li>
                <button className="nav-link logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </li>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <li>
                <button
                  className={`nav-link ${isActive("/") ? "active" : ""}`}
                  onClick={() => handleNavClick("/")}
                >
                  🏠 Home
                </button>
              </li>
              <li>
                <button
                  className="nav-link"
                  onClick={handleFeaturesClick}
                >
                  ✨ Features
                </button>
              </li>
              <li>
                <button className="nav-link login" onClick={() => handleNavClick("/login")}>
                  Login
                </button>
              </li>
              <li>
                <button className="nav-link register" onClick={() => handleNavClick("/register")}>
                  Sign Up
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

    </nav>
  );
}

export default NavBar;
