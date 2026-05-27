import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aegl_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aegl_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('aegl_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('aegl_token');
          localStorage.removeItem('aegl_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('aegl_token', res.data.token);
    localStorage.setItem('aegl_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('aegl_token', res.data.token);
    localStorage.setItem('aegl_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('aegl_token');
    localStorage.removeItem('aegl_token');
    localStorage.removeItem('aegl_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('aegl_user', JSON.stringify(updatedUser));
  };

  const roleName = (user) => {
    if (!user) return '';
    if (user.role === 'admin') return 'Bureau AEGL';
    if (user.role === 'student') return user.gender === 'F' ? 'Étudiante' : 'Étudiant';
    if (user.role === 'host') return user.gender === 'F' ? 'Hébergeuse' : 'Hébergeur';
    return user.role;
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser, roleName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
