// frontend/src/api/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signup       = (data) => API.post('/auth/signup', data);
export const login        = (data) => API.post('/auth/login', data);
export const loginUser    = (data) => API.post('/auth/login', data);   // compatibility
export const registerUser = (data) => API.post('/auth/signup', data);  // compatibility

// ─── Meetings ─────────────────────────────────────────────────────────────────
export const createMeeting = (data)   => API.post('/meetings/create', data);
export const getMyMeetings = ()       => API.get('/meetings/my-meetings');
export const endMeeting    = (roomId) => API.post(`/meetings/${roomId}/end`);

// ─── Reports (via /ai routes — matches aiController + ai.js routes) ──────────
export const saveReport   = (data) => API.post('/ai/save-report', data);
export const getMyReports = ()     => API.get('/ai/my-reports');

export const generateRoadmap = (data) => API.post('/ai/generate-roadmap', data);

// ─── AI ───────────────────────────────────────────────────────────────────────
export const generateQuestions = (role, count = 5) =>
  API.post('/ai/generate-questions', { role, count });

export const analyzeAnswer = (question, answer, role = '') =>
  API.post('/ai/analyze-answer', { question, answer, role });

export const getAIResponse = (context, userMessage) =>
  API.post('/ai/get-response', { context, userMessage });

export const generateFullReport = (role, records) =>
  API.post('/ai/full-report', { role, records });

export default API;