import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const hideOnGuestAuth =
    !isLoggedIn &&
    (location.pathname === "/login" || location.pathname === "/register");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    const storedUser = localStorage.getItem("user");
    let resolvedRole = storedRole || "user";

    if (!storedRole && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        resolvedRole = parsedUser?.role || "user";
      } catch (_err) {
        resolvedRole = "user";
      }
    }

    setIsLoggedIn(Boolean(token));
    setUserRole(resolvedRole);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/");
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
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    } else {
      const target = document.getElementById("features");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const navMenuId = "primary-navigation";

  const renderNavItem = (label, path, extraClass = "", index = 0) => {
    const activeClass = isActive(path) ? "active" : "";

    return (
      <li className="nav-item" style={{ "--item-delay": index }}>
        <button
          className={`nav-link ${extraClass} ${activeClass}`.trim()}
          onClick={() => handleNavClick(path)}
          aria-current={isActive(path) ? "page" : undefined}
        >
          {label}
        </button>
      </li>
    );
  };

  if (hideOnGuestAuth) {
    return null;
  }

  return (
    <nav className={`navbar ${isLoggedIn ? "is-auth" : "is-guest"}`}>
      <div className="nav-container">
        <button
          className="nav-logo"
          type="button"
          aria-label="Go to home"
          onClick={() => handleNavClick(isLoggedIn ? "/dashboard" : "/")}
        >
          <span className="logo-text">UniHub</span>
        </button>

        <button
          className={`hamburger ${mobileOpen ? "active" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls={navMenuId}
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul
          id={navMenuId}
          className={`nav-menu ${mobileOpen ? "active" : ""} ${
            isLoggedIn ? "menu-auth" : "menu-guest"
          }`}
        >
          {isLoggedIn ? (
            <>
              {renderNavItem("Dashboard", "/dashboard", "", 0)}
              {renderNavItem("Search", "/search", "", 1)}
              {renderNavItem("Top", "/top-rated", "", 2)}
              {renderNavItem("Recommended", "/recommend", "", 3)}
              {renderNavItem("Upload", "/upload", "", 4)}
              {renderNavItem("Categories", "/categories", "", 5)}

              {userRole === "admin" && (
                <>
                  <li className="nav-divider"></li>
                  {renderNavItem("Admin", "/admin-dashboard", "admin", 6)}
                </>
              )}

              <li className="nav-item" style={{ "--item-delay": 7 }}>
                <button className="nav-link logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              {renderNavItem("Home", "/", "", 0)}
              <li className="nav-item" style={{ "--item-delay": 1 }}>
                <button className="nav-link" onClick={handleFeaturesClick}>
                  Features
                </button>
              </li>
              {renderNavItem("Login", "/login", "login", 2)}
              {renderNavItem("Sign Up", "/register", "register", 3)}
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;