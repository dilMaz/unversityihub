import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        {/* Top Section - Main Content */}
        <div className="footer-top">
          <div className="footer-section footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎓</span>
              <h3 className="logo-text">UniversityHub</h3>
            </div>
            <p className="brand-description">
              Empowering students with knowledge sharing and collaborative learning.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" title="Facebook">
                <span>f</span>
              </a>
              <a href="#" className="social-link" title="Twitter">
                <span>𝕏</span>
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                <span>in</span>
              </a>
              <a href="#" className="social-link" title="Instagram">
                <span>📷</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="section-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/categories">Browse Modules</Link>
              </li>
              <li>
                <Link to="/upload">Share Notes</Link>
              </li>
              <li>
                <Link to="/search">Search Notes</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="section-title">Resources</h4>
            <ul className="footer-links">
              <li>
                <Link to="/dashboard">My Dashboard</Link>
              </li>
              <li>
                <Link to="/top-rated">Top Rated Notes</Link>
              </li>
              <li>
                <Link to="/recommend">Recommendations</Link>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h4 className="section-title">Support</h4>
            <ul className="footer-links">
              <li>
                <a href="#contact">Contact Us</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="footer-stats">
          <div className="stat">
            <span className="stat-icon">📚</span>
            <div className="stat-content">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Notes Shared</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">👥</span>
            <div className="stat-content">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">🎓</span>
            <div className="stat-content">
              <div className="stat-number">100+</div>
              <div className="stat-label">Modules</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">⭐</span>
            <div className="stat-content">
              <div className="stat-number">4.8/5</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section - Copyright & Links */}
        <div className="footer-bottom">
          <div className="copyright">
            <p>
              © {currentYear} <strong>UniversityHub</strong>. All rights reserved.
            </p>
          </div>
          <div className="bottom-links">
            <a href="#privacy">Privacy</a>
            <span className="separator">•</span>
            <a href="#terms">Terms</a>
            <span className="separator">•</span>
            <a href="#cookies">Cookies</a>
            <span className="separator">•</span>
            <a href="#sitemap">Sitemap</a>
          </div>
          <div className="footer-badge">
            <span className="badge-text">Made with ❤️ by Students</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="footer-decoration footer-decoration-1"></div>
      <div className="footer-decoration footer-decoration-2"></div>
    </footer>
  );
}

export default Footer;
