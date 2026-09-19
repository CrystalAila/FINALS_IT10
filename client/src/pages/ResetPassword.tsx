import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import AuthLayout from '../components/customer/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState(searchParams.get('username') ?? '');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/reset-password', {
        username,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/login', { state: { message: 'Password updated. Please sign in.' } });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account"
      footer={
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
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
          <label htmlFor="token" className="mb-1.5 block text-sm font-semibold text-gray-700">Reset token</label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">New password</label>
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
