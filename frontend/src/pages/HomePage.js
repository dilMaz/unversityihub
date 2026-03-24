import React from "react";
import "../styles/HomePage.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">

      {/* HERO */}
      <section className="hero">
        <h1>
          Access All Your <span>SLIIT Notes</span> in One Place
        </h1>
        <p>Organized by program, year, and semester</p>

        <div className="hero-buttons">
          <button className="primary-btn">Upload Notes</button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/programs")}
          >
            Browse Programs
          </button>
        </div>
      </section>

      {/* PROGRAM CARDS */}
      <section className="programs">
        <h2>Programs</h2>

        <div className="card-grid">
          <div
            className="card"
            onClick={() => navigate("/programs")}
          >
            <h3>Computing</h3>
            <p>IT, SE, DS and more</p>
          </div>

          <div className="card">
            <h3>Business</h3>
            <p>Coming soon</p>
          </div>

          <div className="card">
            <h3>Engineering</h3>
            <p>Coming soon</p>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="notes">
        <h2>Featured Notes</h2>

        <div className="card-grid">
          <div className="note-card">
            <h4>Programming Fundamentals</h4>
            <p>Year 1 • Semester 1</p>
            <span>⭐ 4.8 • 120 downloads</span>
          </div>

          <div className="note-card">
            <h4>Database Systems</h4>
            <p>Year 2 • Semester 2</p>
            <span>⭐ 4.6 • 95 downloads</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stat">
          <h3>1200+</h3>
          <p>Notes</p>
        </div>
        <div className="stat">
          <h3>500+</h3>
          <p>Uploaders</p>
        </div>
        <div className="stat">
          <h3>20K+</h3>
          <p>Downloads</p>
        </div>
        <div className="stat">
          <h3>4.8</h3>
          <p>Avg Rating</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© SLIIT Hub — Student Knowledge Platform</p>
      </footer>

    </div>
  );
};

export default HomePage;