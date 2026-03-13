// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage          from './pages/LandingPage';
import Login                from './pages/Login';
import Signup               from './pages/Signup';
import Dashboard            from './pages/Dashboard';
import RecruiterDashboard   from './pages/RecruiterDashboard';
import CandidateDashboard   from './pages/CandidateDashboard';
import VideoCall            from './pages/VideoCall';

function App() {
  const isAuthenticated = () => localStorage.getItem('token') !== null;

  const ProtectedRoute = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" />;

  const PublicRoute = ({ children }) =>
    isAuthenticated() ? <Navigate to="/dashboard" /> : children;

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Dashboard router (redirects by role) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Role-specific dashboards */}
        <Route path="/recruiter-dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/candidate-dashboard" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />

        {/* Video room */}
        <Route path="/room/:roomId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;