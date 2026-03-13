// frontend/src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/api';
import './Auth.css';

function Signup() {
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole]                     = useState('candidate');
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2)             { setError('Name must be at least 2 characters'); return; }
    if (!email.match(/^\S+@\S+\.\S+$/))    { setError('Please enter a valid email address'); return; }
    if (password.length < 6)               { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword)      { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const response = await signup({ name, email, password, role });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Side */}
      <div className="auth-left">
        <div className="auth-brand-content">
          <div className="brand-logo" onClick={() => navigate('/')}>
            <span className="brand-icon">🚀</span>
            <span className="brand-name">HireMind</span>
          </div>
          <h1 className="auth-left-title">
            {role === 'recruiter'
              ? 'Find Top Talent with AI-Powered Interviews'
              : 'Land Your Dream Job with AI Practice'}
          </h1>
          <p className="auth-left-subtitle">
            {role === 'recruiter'
              ? 'Conduct intelligent video interviews, generate tailored questions, and make better hiring decisions faster.'
              : 'Practice with a live AI interviewer, get scored feedback, and build confidence before the real thing.'}
          </p>
          <div className="auth-features">
            {role === 'recruiter' ? (
              <>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>AI-Generated Interview Questions</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>HD Video Interviews with Screen Share</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Real-Time Answer Analysis</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Interview History & Analytics</span></div>
              </>
            ) : (
              <>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Live AI Interviewer (ARIA)</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Instant Scored Feedback</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Role-Specific Questions</span></div>
                <div className="auth-feature-item"><span className="feature-check">✓</span><span>Join Recruiter Sessions</span></div>
              </>
            )}
          </div>
          <div className="auth-testimonial">
            <p className="testimonial-text">
              {role === 'recruiter'
                ? '"HireMind cut our hiring time in half. The AI questions are incredibly relevant!"'
                : '"I practiced 3 times with ARIA before my interview and got the job!"'}
            </p>
            <div className="testimonial-author">
              <span className="author-avatar">{role === 'recruiter' ? '👩‍💼' : '👨‍💻'}</span>
              <div>
                <div className="author-name">{role === 'recruiter' ? 'Shubhra Maheshwari' : 'Pragya Sharma'}</div>
                <div className="author-role">{role === 'recruiter' ? 'HR Manager, Tech Corp' : 'Software Developer, StartupXYZ'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create Your Account</h2>
            <p>Get started with HireMind today</p>
          </div>

          {/* Role Toggle - Fixed */}
          <div className="role-toggle-wrapper">
            <div className="role-toggle">
              <button
                type="button"
                className={`role-toggle-btn ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => setRole('candidate')}>
                🎓 I'm a Candidate
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${role === 'recruiter' ? 'active' : ''}`}
                onClick={() => setRole('recruiter')}>
                🏢 I'm a Recruiter
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input id="name" type="text" placeholder="John Doe"
                  value={name} onChange={(e) => setName(e.target.value)}
                  required disabled={loading} autoComplete="name" />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input id="email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required disabled={loading} autoComplete="email" />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input id="password" type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength="6" disabled={loading} autoComplete="new-password" />
                <button type="button" className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input id="confirmPassword" type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required minLength="6" disabled={loading} autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> Creating Account...</>
              ) : (
                <>Create {role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account <span className="btn-arrow">→</span></>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="link-button">Sign in</button>
            </p>
          </div>
          <div className="auth-divider"><span>or</span></div>
          <button onClick={() => navigate('/')} className="btn-back-home">← Back to Home</button>
        </div>
      </div>
    </div>
  );
}

export default Signup;