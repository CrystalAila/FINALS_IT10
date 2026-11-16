import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLeftPanel from '../components/customer/AuthLeftPanel';

// Official PoultryLink Business Logo
const ChickenInCartLogo: React.FC<{ size?: 'sm' | 'lg'; light?: boolean }> = ({ size = 'sm', light = false }) => {
  const isLarge = size === 'lg';
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm shrink-0 overflow-hidden ${
        isLarge ? 'h-28 w-28 rounded-3xl p-3' : 'h-11 w-11'
      } ${light ? 'ring-2 ring-white/20' : 'border border-slate-200/60'}`}
    >
      <img
        src="/logo.png"
        alt="PoultryLink Logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login, loading, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err) {
      setError(err);
    }
  }, [location.search]);

  useEffect(() => {
    const token = localStorage.getItem('poultry_token');
    if (user && token) {
      handleSuccessfulAuth(user);
    }
  }, [user]);

  const redirectByRole = (role: string, status?: string) => {
    const isApproved = status === 'verified' || status === 'approved' || status === 'active';
    if (role === 'customer') navigate('/customer');
    else if (role === 'reseller' || role === 'seller') {
      navigate(isApproved ? '/seller/dashboard' : '/account-status');
    } else if (role === 'rider') {
      navigate(isApproved ? '/rider/dashboard' : '/account-status');
    } else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  const handleSuccessfulAuth = (userObj: any) => {
    const fromPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (fromPath?.pathname && fromPath.pathname !== '/login') {
      navigate(`${fromPath.pathname}${fromPath.search || ''}`, { replace: true });
    } else {
      redirectByRole(userObj.role, userObj.status);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const loggedUser = await login(username, password);
      handleSuccessfulAuth(loggedUser);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    }
  };

  const handleGoogleSuccess = (user: { id: number; fullname: string; username: string; role: string; status?: string }) => {
    const token = localStorage.getItem('poultry_token');
    if (token) googleLogin(user as any, token);
    handleSuccessfulAuth(user);
  };

  const handleGoogleRedirect = () => {
    localStorage.setItem('poultry_oauth_role', 'customer');
    sessionStorage.setItem('poultry_oauth_role', 'customer');
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`;
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    window.location.href = `${apiBase}/auth/google/redirect?role=customer`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Exactly as user specified */}
      <AuthLeftPanel />

      {/* RIGHT SIDE: Clean White Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <ChickenInCartLogo size="sm" />
            <span className="text-2xl font-bold text-gray-900">
              Poultry<span className="text-brand">Link</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome to Poultry<span className="text-brand">Link</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Please enter your details to sign in to your account.
            </p>
          </div>

          {/* Flash & Error Messages */}
          {flashMessage && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {flashMessage}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand hover:text-brand-dark transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand hover:text-brand-dark hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider text-gray-400">
              <span className="bg-white px-3">or continue with</span>
            </div>
          </div>

          {/* Social Login: Google */}
          <div>
            <button
              type="button"
              onClick={handleGoogleRedirect}
              disabled={loading}
              title="Sign in with Google"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Don't Have an Account? Create Account */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t Have an Account?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
              Create Account
            </Link>
          </p>

          {/* Portal Navigation */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Are you a poultry seller?</span>
              <Link to="/seller-login" className="font-semibold text-brand hover:underline">
                Seller Portal →
              </Link>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Are you a delivery rider?</span>
              <Link to="/rider/login" className="font-semibold text-brand hover:underline">
                Rider Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

