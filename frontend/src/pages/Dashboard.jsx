// frontend/src/pages/Dashboard.jsx
// Smart router — reads user role from localStorage and redirects
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userData);
    if (user.role === 'recruiter' || user.role === 'admin') {
      navigate('/recruiter-dashboard', { replace: true });
    } else {
      navigate('/candidate-dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f8f7ff',
      fontSize: 16, color: '#7c3aed', fontFamily: 'sans-serif'
    }}>
      Redirecting...
    </div>
  );
}

export default Dashboard;