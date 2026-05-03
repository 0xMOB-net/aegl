import axios from 'axios';

// En dev : Vite proxy redirige /api → localhost:4000 (vite.config.js)
// En prod : VITE_API_URL = https://aegl-api.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aegl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs 401 globalement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aegl_token');
      localStorage.removeItem('aegl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
