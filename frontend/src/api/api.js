// frontend/src/api/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const signup = (userData) => API.post('/auth/signup', userData);
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');

// ==================== AI APIs ====================
export const generateQuestions = (role, count) => 
  API.post('/ai/generate-questions', { role, count });

export const analyzeAnswer = (question, answer) => 
  API.post('/ai/analyze-answer', { question, answer });

export const generateSummary = (transcript, duration) => 
  API.post('/ai/generate-summary', { transcript, duration });

export const getAIResponse = (context, message) => 
  API.post('/ai/ai-response', { context, message });

export default API;