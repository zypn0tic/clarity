import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clarity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clarity_token');
      localStorage.removeItem('clarity_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
