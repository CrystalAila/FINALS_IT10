import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 p-12 text-white">
        {/* Subtle Ambient Decorative Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />

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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

            {/* Gray Sign In Button per Figma */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-800 hover:bg-gray-900 py-3.5 text-sm font-semibold text-white shadow-md shadow-gray-900/10 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Social Login Icons (Google, Facebook, LinkedIn) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleRedirect}
              disabled={loading}
              title="Sign in with Google"
              className="flex items-center justify-center rounded-xl border border-gray-300 bg-white py-2.5 shadow-sm transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>

            {/* Facebook */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setError('Facebook login is currently available via registered email.')}
              title="Sign in with Facebook"
              className="flex items-center justify-center rounded-xl border border-gray-300 bg-white py-2.5 shadow-sm transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none disabled:opacity-60"
            >
              <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setError('LinkedIn login is currently available via registered email.')}
              title="Sign in with LinkedIn"
              className="flex items-center justify-center rounded-xl border border-gray-300 bg-white py-2.5 shadow-sm transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none disabled:opacity-60"
            >
              <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
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

