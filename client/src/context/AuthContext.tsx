import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

type User = {
  id: number;
  fullname: string;
  username: string;
  role: 'customer' | 'reseller' | 'admin';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: { fullname: string; username: string; password: string; role?: string }) => Promise<User>;
  logout: () => Promise<void>;
  logActivity: (activity: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('poultry_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('poultry_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('poultry_token', token);
    } else {
      localStorage.removeItem('poultry_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('poultry_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('poultry_user');
    }
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = localStorage.getItem('poultry_token');
      if (!savedToken || user) return;

      try {
        const res = await api.get('/user');
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
        setToken(null);
      }
    };

    bootstrap();
  }, [user]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      const { user: u, token: t } = res.data;
      localStorage.setItem('poultry_token', t);
      localStorage.setItem('poultry_user', JSON.stringify(u));
      setUser(u);
      setToken(t);
      try {
        await api.post('/logs', { activity: 'Frontend: user logged in' });
      } catch (e) {
        // ignore logging errors
      }
      return u as User;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { fullname: string; username: string; password: string; role?: string }) => {
    setLoading(true);
    try {
      const res = await api.post('/register', payload);
      const { user: u, token: t } = res.data;
      localStorage.setItem('poultry_token', t);
      localStorage.setItem('poultry_user', JSON.stringify(u));
      setUser(u);
      setToken(t);
      try {
        await api.post('/logs', { activity: 'Frontend: user registered' });
      } catch (e) {
        // ignore logging errors
      }
      return u as User;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/logout');
      try {
        await api.post('/logs', { activity: 'Frontend: user logged out' });
      } catch (e) {
        // ignore logging errors
      }
    } catch (err) {
      // ignore logout errors
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('poultry_token');
    localStorage.removeItem('poultry_user');
    setLoading(false);
  };

  const logActivity = async (activity: string) => {
    try {
      await api.post('/logs', { activity });
    } catch (e) {
      // ignore logging failures
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, logActivity }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
