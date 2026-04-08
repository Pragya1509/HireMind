import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage        from './pages/LandingPage';
import Login              from './pages/Login';
import Signup             from './pages/Signup';
import Dashboard          from './pages/Dashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import VideoCall          from './pages/VideoCall';
import ARIASetup          from './pages/ARIASetup';
import ARIAInterview      from './pages/ARIAInterview';
import StudyMaterial      from './pages/StudyMaterial';
import Mentorship           from './pages/Mentorship';
import InterviewRoadmap from './pages/InterviewRoadmap';

const isAuthenticated = () => localStorage.getItem('token') !== null;

const ProtectedRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"  element={<PublicRoute><Signup /></PublicRoute>} />

        <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/recruiter-dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/candidate-dashboard" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
        <Route path="/room/:roomId"        element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
        <Route path="/aria-setup"          element={<ProtectedRoute><ARIASetup /></ProtectedRoute>} />
        <Route path="/aria-interview"      element={<ProtectedRoute><ARIAInterview /></ProtectedRoute>} />
        <Route path="/study-material" element={<ProtectedRoute><StudyMaterial /></ProtectedRoute>} />
        <Route path="/mentorship"     element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />        
        <Route path="/interview-roadmap" element={<ProtectedRoute><InterviewRoadmap /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;