// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🎥',
      title: 'HD Video Interviews',
      description: 'Crystal-clear video quality with real-time communication for seamless remote interviews.'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Questions',
      description: 'Get intelligent interview questions generated specifically for any job role instantly.'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Receive AI-driven analysis and feedback on candidate responses in real-time.'
    },
    {
      icon: '🖥️',
      title: 'Screen Sharing',
      description: 'Share screens effortlessly to review portfolios, code, or presentations together.'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Built-in chat functionality for quick questions and seamless communication.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'End-to-end encryption ensures your interviews remain confidential and secure.'
    }
  ];

  const testimonials = [
    {
      name: 'Shubhra Maheshwari',
      role: 'Backend Developer',
      company: 'Banasthali Vidyapith',
      image: '👩‍💼',
      text: 'HireMind transformed our hiring process! The AI questions are spot-on and save us hours of prep time.'
    },
    {
      name: 'Pragya Sharma',
      role: 'Frontend Developer',
      company: 'Banasthali Vidyapith',
      image: '👨‍💻',
      text: 'The best interview platform I\'ve used. Video quality is excellent and the AI analysis is incredibly helpful.'
    },
    {
      name: 'Manya Agarwal',
      role: 'Database Administrator',
      company: 'Banasthali Vidyapith',
      image: '👩‍🎓',
      text: 'Game-changer for remote hiring! Our team loves the intuitive interface and powerful features.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Interviews Conducted' },
    { number: '500+', label: 'Companies Trust Us' },
    { number: '95%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">HireMind</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
            <button onClick={() => navigate('/login')} className="btn-nav-login">
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="btn-nav-signup">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Your Hiring with
              <span className="gradient-text"> AI-Powered Interviews</span>
            </h1>
            <p className="hero-subtitle">
              Conduct professional video interviews with intelligent AI assistance. 
              Generate questions, analyze responses, and make better hiring decisions faster.
            </p>
            <div className="hero-buttons">
              <button onClick={() => navigate('/signup')} className="btn-hero-primary">
                Start Free Trial
                <span className="btn-arrow">→</span>
              </button>
              <button onClick={() => navigate('/login')} className="btn-hero-secondary">
                Sign In
              </button>
            </div>
            <div className="hero-trust">
              <p>Trusted by leading companies worldwide</p>
              <div className="trust-badges">
                <span>⭐⭐⭐⭐⭐</span>
                <span>500+ Reviews</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-1">
              <div className="card-icon">📹</div>
              <div className="card-text">Live Interview</div>
            </div>
            <div className="hero-card hero-card-2">
              <div className="card-icon">🤖</div>
              <div className="card-text">AI Analysis</div>
            </div>
            <div className="hero-card hero-card-3">
              <div className="card-icon">✅</div>
              <div className="card-text">Smart Hiring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features for Modern Hiring</h2>
          <p className="section-subtitle">
            Everything you need to conduct professional, AI-enhanced video interviews
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How HireMind Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Your Account</h3>
              <p>Sign up in seconds and set up your interview preferences</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Start Interview</h3>
              <p>Launch a video call and let AI generate relevant questions</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get AI Insights</h3>
              <p>Receive instant analysis and make informed hiring decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-subtitle">Hear from hiring professionals who use HireMind</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.image}</div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Hiring Process?</h2>
          <p className="cta-subtitle">
            Join thousands of companies using HireMind to find the best talent
          </p>
          <div className="cta-buttons">
            <button onClick={() => navigate('/signup')} className="btn-cta-primary">
              Start Free Trial Today
            </button>
            <button onClick={() => navigate('/login')} className="btn-cta-secondary">
              Sign In to Your Account
            </button>
          </div>
          <p className="cta-note">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">🚀 HireMind</h3>
            <p className="footer-desc">AI-powered video interview platform for modern hiring teams</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 HireMind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;