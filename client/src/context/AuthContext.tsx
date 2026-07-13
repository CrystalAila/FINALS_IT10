import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

export type User = {
  id: number;
  fullname: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  google_id?: string | null;
  role: 'customer' | 'reseller' | 'admin';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: {
    fullname: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
    role?: string;
  }) => Promise<User>;
  googleLogin: (user: User, token: string) => void;
  updateProfile: (payload: {
    fullname?: string;
    email?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    current_password?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  logActivity: (activity: string) => Promise<void>;
  setUser: (user: User | null) => void;
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
      } catch {
        setUser(null);
        setToken(null);
      }
    };

    bootstrap();
  }, [user]);

  const persistSession = (u: User, t: string) => {
    localStorage.setItem('poultry_token', t);
    localStorage.setItem('poultry_user', JSON.stringify(u));
    setUser(u);
    setToken(t);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      const { user: u, token: t } = res.data;
      persistSession(u, t);
      try {
        await api.post('/logs', { activity: 'Frontend: user logged in' });
      } catch {
        // ignore
      }
      return u as User;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    fullname: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
    role?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.post('/register', payload);
      const { user: u, token: t } = res.data;
      persistSession(u, t);
      try {
        await api.post('/logs', { activity: 'Frontend: user registered' });
      } catch {
        // ignore
      }
      return u as User;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = (u: User, t: string) => {
    persistSession(u, t);
  };

  const updateProfile = async (payload: {
    fullname?: string;
    email?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    current_password?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.put('/user', payload);
      const u = res.data.user as User;
      setUser(u);
      return u;
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
      } catch {
        // ignore
      }
    } catch {
      // ignore
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
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, updateProfile, logout, logActivity, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
