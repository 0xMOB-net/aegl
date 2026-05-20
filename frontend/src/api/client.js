import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('aegl_token') || localStorage.getItem('aegl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Don't redirect on 401 from the login endpoint itself (wrong password)
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      sessionStorage.removeItem('aegl_token');
      localStorage.removeItem('aegl_token');
      localStorage.removeItem('aegl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
