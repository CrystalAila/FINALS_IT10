import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/customer/GoogleLoginButton';

// Official PoultryLink Chicken-in-Cart Brand Logo
const ChickenInCartLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; light?: boolean }> = ({
  size = 'sm',
  light = false,
}) => {
  const dims = size === 'lg' ? 'h-24 w-24' : size === 'md' ? 'h-12 w-12' : 'h-10 w-10';
  const strokeColor = light ? '#FFFFFF' : '#143828';
  const meshColor = light ? 'rgba(255,255,255,0.35)' : 'rgba(20,56,40,0.2)';

  return (
    <div className={`relative inline-flex items-center justify-center ${dims}`}>
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        {/* Cart Handle & Frame */}
        <path
          d="M12 22H20L26 50H58L66 26H23"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cart Wire Grid */}
        <path
          d="M28 34H62M30 42H56M36 26V50M46 26V50M56 26V46"
          stroke={meshColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Wheels */}
        <circle cx="30" cy="59" r="4" fill={strokeColor} />
        <circle cx="30" cy="59" r="1.8" fill={light ? '#143828' : '#FFFFFF'} />
        <circle cx="54" cy="59" r="4" fill={strokeColor} />
        <circle cx="54" cy="59" r="1.8" fill={light ? '#143828' : '#FFFFFF'} />

        {/* Chicken Inside Cart */}
        {/* Red Comb */}
        <path
          d="M37 12C37 9.5 39 8 41 9C42.5 7.5 45.5 8 46 10C47.5 8.5 50 9.5 50 12C50 13 48 14 47 14H39C38 14 37 13 37 12Z"
          fill="#DC2626"
        />
        {/* Chicken Head & Body */}
        <path
          d="M37 23C35 18 38 13 43 13C48 13 51 17 51 22C55 22 59 25 57 31C54 37 48 39 43 39C37 39 33 35 33 30C33 26 35 24 37 23Z"
          fill={light ? '#FEF3C7' : '#F59E0B'}
        />
        {/* Beak */}
        <path d="M50 18L55 20L50 22Z" fill="#EA580C" />
        {/* Eye */}
        <circle cx="46" cy="17" r="1.4" fill="#1C1917" />
        {/* Wing Highlight */}
        <path
          d="M39 26C42 25 47 26 48 30C48 34 44 35 40 34C38 33 38 28 39 26Z"
          fill={light ? '#FDE68A' : '#D97706'}
        />
      </svg>
    </div>
  );
};

const SellerLogin: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

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
      const user = await login('', password, businessName);
      redirectByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#FAF9F6]">
      {/* LEFT SIDE: Green Gradient with Handcrafted Depth & Local Panay Context */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 lg:p-16 text-white select-none"
        style={{
          background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)',
        }}
      >
        {/* Subtle Organic Farm Topography Pattern Overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-screen"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="farm-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#farm-grid)" />
        </svg>

        {/* Top Header: PoultryLink Logo & Brand */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
            <ChickenInCartLogo size="sm" light />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Poultry<span className="text-[#D96B27]">Link</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-emerald-200/70 font-medium">
              Seller Hub
            </span>
          </div>
        </div>

        {/* Narrative & Value Section */}
        <div className="relative z-10 my-auto max-w-lg space-y-7">
          {/* Subtle Region Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-emerald-100 border border-white/15 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Capiz Farm Partner Network</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-white leading-[1.18] lg:text-[42px]">
            From local poultry farms across Panay to community tables.
          </h1>

          {/* Natural Local Description */}
          <p className="text-[15px] leading-relaxed text-emerald-100/85 font-normal">
            PoultryLink connects backyard raisers, layer farms, and registered poultry dressers
            directly with local markets, food businesses, and households across Roxas City and Capiz Province.
          </p>

          {/* Authentic Farm Value Highlights */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl bg-white/[0.07] border border-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
                Fair Farm-Gate Value
              </span>
              <p className="text-xs text-emerald-100/75 leading-normal">
                Direct trade without excessive middleman markups or delayed settlement.
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.07] border border-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
                Reliable Dispatch
              </span>
              <p className="text-xs text-emerald-100/75 leading-normal">
                Coordinate fresh egg trays and live or dressed birds with certified local riders.
              </p>
            </div>
          </div>
        </div>

        {/* Quiet Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 border-t border-white/10 pt-5">
          <span>© 2026 PoultryLink • Roxas City, Capiz</span>
          <span>Farm Operations & Logistics</span>
        </div>
      </div>

      {/* RIGHT SIDE: Handcrafted, Clean Form Panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Mobile Header Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900/5 border border-emerald-900/10">
              <ChickenInCartLogo size="sm" />
            </div>
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
            <div className="mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FAF2EB] border border-[#F0DFD1] px-2.5 py-1 text-[11px] font-semibold text-[#B8561B]">
                Seller Access
              </span>
            </div>

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


