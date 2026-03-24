import { useNavigate } from "react-router-dom";
import "../styles/home.css";

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🔍",
      title: "Smart Search",
      desc: "Find notes instantly using advanced search with filters by subject, author, and rating",
    },
    {
      icon: "⭐",
      title: "Top Rated",
      desc: "Discover the highest-rated notes from the community, ranked by quality and popularity",
    },
    {
      icon: "🤖",
      title: "AI Powered",
      desc: "Get personalized note recommendations based on your study patterns and preferences",
    },
    {
      icon: "📤",
      title: "Easy Upload",
      desc: "Share your notes with the community in seconds with automatic categorization",
    },
    {
      icon: "📝",
      title: "AI Quizzes",
      desc: "Generate AI-powered quizzes from notes to test your understanding instantly",
    },
    {
      icon: "📂",
      title: "Organize",
      desc: "Browse notes by category and subject for easy navigation and discovery",
    },
  ];

  const stats = [
    { label: "Active Students", value: "10K+", icon: "👥" },
    { label: "Notes Shared", value: "50K+", icon: "📄" },
    { label: "Subjects", value: "100+", icon: "📚" },
    { label: "Success Rate", value: "95%", icon: "✅" },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Your <span>Study Companion</span> Awaits
            </h1>
            <p className="hero-subtitle">
              Share, discover, and ace your exams with UniHub. Connect with students worldwide and access quality notes whenever you need them.
            </p>

            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/register")}
              >
                Get Started Free 🚀
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/login")}
              >
                Sign In →
              </button>
            </div>

            <div className="hero-badges">
              <span className="badge">✨ Free Forever</span>
              <span className="badge">🔒 100% Secure</span>
              <span className="badge">⚡ Lightning Fast</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-illustration">
              <div className="book">📚</div>
              <div className="note">📝</div>
              <div className="search">🔍</div>
              <div className="star">⭐</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to excel in your studies</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Join Thousands of Students</h2>
          <p>UniHub by the numbers</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to get started</p>
        </div>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your free account in seconds</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Browse Notes</h3>
            <p>Search or browse by category</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Excel Faster</h3>
            <p>Learn with AI quizzes & insights</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-blob"></div>
        <h2>Ready to transform your study habits?</h2>
        <p>Join thousands of students already using UniHub</p>
        <button
          className="btn btn-primary large"
          onClick={() => navigate("/register")}
        >
          Start Learning Now → 
        </button>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
          <h2>What Students Say</h2>
          <p>Real feedback from real learners</p>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"UniHub saved my semester! The notes are organized and the quiz feature is amazing."</p>
            <div className="testimonial-author">
              <span>🧑‍🎓</span>
              <div>
                <div className="author-name">Sarah</div>
                <div className="author-role">Computer Science</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"Easy to upload notes and it's incredible how well the AI generates quizzes. Highly recommend!"</p>
            <div className="testimonial-author">
              <span>🧑‍🎓</span>
              <div>
                <div className="author-name">Alex</div>
                <div className="author-role">Engineering</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"Best study platform I've used. The community is supportive and the system actually works!"</p>
            <div className="testimonial-author">
              <span>🧑‍🎓</span>
              <div>
                <div className="author-name">Jordan</div>
                <div className="author-role">Business Major</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>📚 UniHub</h4>
            <p>Making education accessible to everyone</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => navigate("/login")}>Login</button></li>
              <li><button onClick={() => navigate("/register")}>Register</button></li>
              <li><a href="#features">Features</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>support@unihub.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 UniHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
