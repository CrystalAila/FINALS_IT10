import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/customer/GoogleLoginButton';
import AuthLeftPanel from '../components/customer/AuthLeftPanel';

// Official PoultryLink Brand Logo
const ChickenInCartLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; light?: boolean }> = ({
  size = 'sm',
  light = false,
}) => {
  const isLarge = size === 'lg';
  const isMedium = size === 'md';
  const dimensionClass = isLarge ? 'h-28 w-28 rounded-3xl p-3' : isMedium ? 'h-16 w-16 rounded-2xl p-2' : 'h-11 w-11 rounded-2xl p-1.5';

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white shadow-sm shrink-0 overflow-hidden ${dimensionClass} ${
        light ? 'ring-2 ring-white/20' : 'border border-slate-200/60'
      }`}
    >
      <img
        src="/logo.png"
        alt="PoultryLink Logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
};

const SellerLogin: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectByRole = (role: string) => {
    if (role === 'customer') navigate('/customer');
    else if (role === 'reseller' || role === 'seller') navigate('/seller/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('poultry_token');
    if (user && token) {
      const fromPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
      if (fromPath?.pathname && fromPath.pathname !== '/seller-login') {
        navigate(`${fromPath.pathname}${fromPath.search || ''}`, { replace: true });
      } else {
        redirectByRole(user.role);
      }
    }
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login('', password, businessName);
      const fromPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
      if (fromPath?.pathname && fromPath.pathname !== '/seller-login') {
        navigate(`${fromPath.pathname}${fromPath.search || ''}`, { replace: true });
      } else {
        redirectByRole(user.role);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#FAF9F6]">
      {/* LEFT SIDE: Exactly as user specified */}
      <AuthLeftPanel />

      {/* RIGHT SIDE: Handcrafted, Clean Form Panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Mobile Header Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <ChickenInCartLogo size="sm" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-stone-900">
                Poultry<span className="text-[#D96B27]">Link</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">
                Seller Hub
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Seller Portal
            </h2>
            <p className="mt-1.5 text-sm text-stone-500 font-normal">
              Enter your business credentials to manage your farm inventory and orders.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Business Name Field */}
            <div>
              <label
                htmlFor="businessName"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Registered Farm / Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#0F281E] focus:ring-2 focus:ring-[#0F281E]/10"
                placeholder="e.g. Santos Poultry & Layer Farm"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-11 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#0F281E] focus:ring-2 focus:ring-[#0F281E]/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500 hover:text-stone-700 transition focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Softened Terracotta Orange "Sign In as Seller" Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Verifying credentials...' : 'Sign In as Seller'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider text-stone-400">
              <span className="bg-white px-3 font-medium">or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton role="seller" disabled={loading} text="Continue with Google" />

          {/* Footer Navigation */}
          <div className="mt-8 space-y-3 text-center text-sm">
            <p className="text-stone-600 text-xs">
              Not registered as a farm partner yet?{' '}
              <Link
                to="/seller-register"
                className="font-semibold text-[#D96B27] hover:text-[#B34F14] hover:underline"
              >
                Register as Seller
              </Link>
            </p>

            <div className="pt-2 border-t border-stone-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
              >
                ← Back to Customer Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;


