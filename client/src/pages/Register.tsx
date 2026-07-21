import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/customer/AuthLayout';
import GoogleLoginButton from '../components/customer/GoogleLoginButton';

const Register: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, loading, googleLogin } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await register({ fullname, username, password, email: email || undefined, phone: phone || undefined });
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'seller' || user.role === 'reseller') navigate('/seller/dashboard');
      else navigate('/customer');
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(', ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Registration failed');
      }
    }
  };

  const handleGoogleSuccess = (user: { id: number; fullname: string; username: string; role: string }) => {
    const token = localStorage.getItem('poultry_token');
    if (token) googleLogin(user as any, token);
    navigate('/customer');
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join PoultryLink and order fresh poultry"
      footer={
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-gray-700">Full name</label>
          <input
            id="fullname"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-gray-700">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">Email (optional)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700">Phone (optional)</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} disabled={loading} />
    </AuthLayout>
  );
};

export default Register;
