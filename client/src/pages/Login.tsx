import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Chicken in Cart Brand Logo SVG
const ChickenInCartLogo: React.FC<{ size?: 'sm' | 'lg'; light?: boolean }> = ({ size = 'sm', light = false }) => {
  const isLarge = size === 'lg';
  return (
    <div className={`relative inline-flex items-center justify-center ${isLarge ? 'h-36 w-36' : 'h-12 w-12'}`}>
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-md"
        aria-hidden="true"
      >
        {/* Shopping Cart Handle & Frame */}
        <path
          d="M12 22H20L26 50H58L66 26H23"
          stroke={light ? '#FFFFFF' : '#166534'}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cart Wire Grids */}
        <path
          d="M28 34H62M30 42H56M36 26V50M46 26V50M56 26V46"
          stroke={light ? 'rgba(255,255,255,0.45)' : 'rgba(22,101,52,0.25)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Wheels */}
        <circle cx="30" cy="59" r="4.5" fill={light ? '#FFFFFF' : '#166534'} />
        <circle cx="30" cy="59" r="2" fill={light ? '#166534' : '#FFFFFF'} />
        <circle cx="54" cy="59" r="4.5" fill={light ? '#FFFFFF' : '#166534'} />
        <circle cx="54" cy="59" r="2" fill={light ? '#166534' : '#FFFFFF'} />

        {/* Chicken Inside Cart */}
        {/* Red Comb */}
        <path
          d="M37 12C37 9.5 39 8 41 9C42.5 7.5 45.5 8 46 10C47.5 8.5 50 9.5 50 12C50 13 48 14 47 14H39C38 14 37 13 37 12Z"
          fill="#EF4444"
        />
        {/* Chicken Body */}
        <path
          d="M37 23C35 18 38 13 43 13C48 13 51 17 51 22C55 22 59 25 57 31C54 37 48 39 43 39C37 39 33 35 33 30C33 26 35 24 37 23Z"
          fill={light ? '#FFFBEB' : '#F59E0B'}
        />
        {/* Beak */}
        <path d="M50 18L55 20L50 22Z" fill="#F97316" />
        {/* Eye */}
        <circle cx="46" cy="17" r="1.5" fill="#1F2937" />
        {/* Wing Detail */}
        <path
          d="M39 26C42 25 47 26 48 30C48 34 44 35 40 34C38 33 38 28 39 26Z"
          fill={light ? '#FEF3C7' : '#D97706'}
        />
      </svg>
    </div>
  );
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loading, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;

  const redirectByRole = (role: string) => {
    if (role === 'customer') navigate('/customer');
    else if (role === 'reseller' || role === 'seller') navigate('/seller/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username, password);
      redirectByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    }
  };

  const handleGoogleSuccess = (user: { id: number; fullname: string; username: string; role: string }) => {
    const token = localStorage.getItem('poultry_token');
    if (token) googleLogin(user as any, token);
    redirectByRole(user.role);
  };

  const handleGoogleRedirect = () => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
    window.location.href = `${API_BASE}/auth/google/redirect?role=customer`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Green Gradient with Large Logo & Tagline */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 text-white"
        style={{
          background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)',
        }}
      >

        {/* Top Mini Brand Bar */}
        <div className="relative z-10 flex items-center gap-3">
          <ChickenInCartLogo size="sm" light />
          <span className="text-xl font-bold tracking-tight">
            Poultry<span className="text-emerald-300">Link</span>
          </span>
        </div>

        {/* Center Hero with Large Chicken-in-Cart Logo & Tagline */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center">
          <div className="mb-8 flex items-center justify-center rounded-3xl bg-white/10 p-6 backdrop-blur-md shadow-2xl shadow-black/20 border border-white/15">
            <ChickenInCartLogo size="lg" light />
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Poultry<span className="text-emerald-300">Link</span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm font-semibold tracking-[0.25em] text-emerald-100 uppercase">
            FARM TO YOU. LINKED WITH CARE.
          </p>

          <p className="mt-4 max-w-sm text-sm text-emerald-100/80 leading-relaxed">
            Connecting local Capiz poultry farms directly with households, restaurants, and businesses.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/70">
          <span>© 2026 PoultryLink. All rights reserved.</span>
          <span>Fresh • Local • Trusted</span>
        </div>
      </div>

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
            <div className="hidden lg:flex items-center gap-2.5 mb-4">
              <ChickenInCartLogo size="sm" />
              <span className="text-xl font-bold text-gray-900">
                Poultry<span className="text-brand">Link</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome to PoultryLink</h1>
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
            {/* Email / Username Field */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
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

          {/* Preserved Seller Portal & Demo Accounts Navigation */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Are you a poultry seller?</span>
              <Link to="/seller-login" className="font-semibold text-brand hover:underline">
                Seller Portal →
              </Link>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-500 flex justify-between">
              <span>Customer: <code className="text-gray-700">customer</code> / <code className="text-gray-700">password123</code></span>
              <span>Admin: <code className="text-gray-700">admin</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

