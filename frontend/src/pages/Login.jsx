// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Success! Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Side - Branding */}
      <div className="auth-left">
        <div className="auth-brand-content">
          <div className="brand-logo" onClick={() => navigate('/')}>
            <span className="brand-icon">🚀</span>
            <span className="brand-name">HireMind</span>
          </div>
          
          <h1 className="auth-left-title">
            Welcome Back to HireMind
          </h1>
          
          <p className="auth-left-subtitle">
            Continue conducting intelligent AI-powered video interviews and making better hiring decisions.
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <span className="feature-check">✓</span>
              <span>Access Your Interview Dashboard</span>
            </div>
            <div className="auth-feature-item">
              <span className="feature-check">✓</span>
              <span>Review Past Interviews</span>
            </div>
            <div className="auth-feature-item">
              <span className="feature-check">✓</span>
              <span>Start New AI Interviews</span>
            </div>
            <div className="auth-feature-item">
              <span className="feature-check">✓</span>
              <span>View Analytics & Insights</span>
            </div>
          </div>

          <div className="auth-stats">
            <div className="stat-box">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Interviews</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">500+</div>
              <div className="stat-label">Companies</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Sign In to Your Account</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">
                Password
                <button type="button" className="forgot-password">
                  Forgot?
                </button>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="link-button">
                Sign up for free
              </button>
            </p>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button onClick={() => navigate('/')} className="btn-back-home">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;