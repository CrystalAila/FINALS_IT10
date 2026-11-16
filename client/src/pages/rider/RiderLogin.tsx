import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/customer/AuthLayout';
import GoogleLoginButton from '../../components/customer/GoogleLoginButton';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const RiderLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;

  // Handle error from URL query params (e.g., Google OAuth role-mismatch redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [location.search]);

  // Auto-redirect if already logged in as a rider
  useEffect(() => {
    const token = localStorage.getItem('poultry_token');
    if (user && token && user.role === 'rider') {
      const status = (user.status || '').toLowerCase();
      const isApproved = status === 'verified' || status === 'approved' || status === 'active';
      navigate(isApproved ? '/rider/dashboard' : '/account-status', { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(identifier.trim(), password);
      if (user.role === 'rider') {
        const status = (user.status || '').toLowerCase();
        const isApproved = status === 'verified' || status === 'approved' || status === 'active';
        if (!isApproved) {
          navigate('/account-status');
          return;
        }
        navigate('/rider/dashboard');
      } else {
        setError('This portal is reserved for delivery riders only. Please use the appropriate portal for your account.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    }
  };

  return (
    <AuthLayout
      title="Rider Sign In"
      subtitle="Access your delivery tasks, claimed orders, and navigation"
      footer={
        <div className="mt-8 text-center text-sm text-gray-500 space-y-3">
          <p>
            Don't have a rider account?{' '}
            <Link to="/rider/register" className="font-semibold text-brand hover:underline">
              Apply to become a rider
            </Link>
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>Other portals:</span>
            <Link to="/login" className="text-brand hover:underline font-medium">
              Customer Sign In
            </Link>
            <span>•</span>
            <Link to="/seller-login" className="text-brand hover:underline font-medium">
              Seller Sign In
            </Link>
          </div>
        </div>
      }
    >
      {flashMessage && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
            flashMessage.toLowerCase().includes('reject')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : flashMessage.toLowerCase().includes('pending')
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {flashMessage.toLowerCase().includes('reject') ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span>{flashMessage}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="identifier" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Username or Phone Number
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter username or phone number"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3.5 px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in...
            </>
          ) : (
            'Sign In as Rider'
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Google Sign-In */}
        <GoogleLoginButton role="rider" text="Continue with Google" />
      </form>
    </AuthLayout>
  );
};

export default RiderLogin;
