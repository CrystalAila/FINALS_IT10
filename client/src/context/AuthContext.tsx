import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

export type User = {
  id: number;
  fullname: string;
  username: string;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  google_id?: string | null;
  role: 'customer' | 'reseller' | 'seller' | 'admin' | 'rider';
  status?: 'pending' | 'under_review' | 'verified' | 'suspended' | 'rejected' | 'active';
  farm?: any;
  rider?: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  initializing: boolean;
  login: (username: string, password: string, business_name?: string, phone?: string) => Promise<User>;
  register: (payload: {
    fullname: string;
    username?: string;
    business_name?: string;
    password: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
  } | FormData) => Promise<User>;
  registerRider: (formData: FormData) => Promise<{ message: string; user?: any; rider?: any }>;
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
  const normalizeRole = (role: string) => (role === 'reseller' ? 'seller' : role as User['role']);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('poultry_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem('poultry_token');
    const raw = localStorage.getItem('poultry_user');
    if (!savedToken || !raw) {
      localStorage.removeItem('poultry_user');
      localStorage.removeItem('poultry_token');
      return null;
    }
    try {
      const saved = JSON.parse(raw) as User;
      return { ...saved, role: normalizeRole(saved.role) };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('poultry_token'));
  });

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
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('poultry_token');
      localStorage.removeItem('poultry_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (window.location.pathname === '/auth/callback') {
        setInitializing(false);
        return;
      }

      const savedToken = localStorage.getItem('poultry_token');
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setInitializing(false);
        return;
      }

      try {
        const res = await api.get('/user');
        const userData = res.data.user as User;
        let savedRole: User['role'] | null = null;
        try {
          const rawSaved = localStorage.getItem('poultry_user');
          if (rawSaved) {
            const parsed = JSON.parse(rawSaved) as User;
            if (parsed && parsed.id === userData.id) {
              savedRole = normalizeRole(parsed.role);
            }
          }
        } catch {
          // ignore
        }

        const hasProfile =
          Boolean(userData.farm?.permit_file) || Boolean(userData.rider?.license_photo_path);
        const effectiveRole =
          !hasProfile && savedRole && userData.role !== 'admin'
            ? savedRole
            : normalizeRole(userData.role);

        const normalizedUser = {
          ...userData,
          role: effectiveRole,
          status:
            !hasProfile && effectiveRole === 'customer'
              ? 'active'
              : !hasProfile && (effectiveRole === 'seller' || effectiveRole === 'rider')
              ? 'pending'
              : userData.status,
        };
        setUser(normalizedUser);
        setToken(savedToken);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('poultry_token');
          localStorage.removeItem('poultry_user');
        }
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user || !token || (user.role !== 'seller' && user.role !== 'reseller')) return;

    const checkStatus = async () => {
      try {
        const res = await api.get('/user');
        const latestUser = res.data.user;
        if (latestUser && latestUser.status !== user.status) {
          const normalized = { ...latestUser, role: normalizeRole(latestUser.role) };
          setUser(normalized);
        }
      } catch (err) {
        console.error('Failed to sync user status:', err);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [user, token]);

  const persistSession = (u: User, t: string) => {
    const normalizedUser = { ...u, role: normalizeRole(u.role) };
    localStorage.setItem('poultry_token', t);
    localStorage.setItem('poultry_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setToken(t);
  };

  const login = async (username: string, password: string, business_name?: string, phone?: string) => {
    setLoading(true);
    try {
      const payload: any = { password };
      if (business_name) {
        payload.business_name = business_name;
      } else {
        payload.username = username;
      }
      if (phone) {
        payload.phone = phone;
      }
      const res = await api.post('/login', payload);
      const { user: u, token: t } = res.data;
      localStorage.removeItem('poultry_role_override');
      localStorage.removeItem('poultry_oauth_role');
      sessionStorage.removeItem('poultry_oauth_role');
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

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
      const res = await api.post('/register', payload, { headers });
      const { user: u, token: t } = res.data;
      if (t) {
        persistSession(u, t);
      }
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

  const registerRider = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/rider/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      try {
        await api.post('/logs', { activity: 'Frontend: rider registered application submitted' });
      } catch {
        // ignore
      }
      return res.data;
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
    localStorage.removeItem('poultry_role_override');
    localStorage.removeItem('poultry_oauth_role');
    sessionStorage.removeItem('poultry_oauth_role');
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
      value={{ user, token, loading, initializing, login, register, registerRider, googleLogin, updateProfile, logout, logActivity, setUser }}
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
