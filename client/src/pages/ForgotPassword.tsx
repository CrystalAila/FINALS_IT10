import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import AuthLayout from '../components/customer/AuthLayout';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ token: string; username: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/forgot-password', { username });
      setSuccess({ token: res.data.reset_token, username: res.data.username });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your username to reset your password"
      footer={
        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {success ? (
        <div className="mt-8 space-y-4 rounded-xl bg-green-50 p-5 text-sm text-green-800">
          <p className="font-semibold">Reset token generated</p>
          <p>Use the link below to set a new password. Token expires in 60 minutes.</p>
          <Link
            to={`/reset-password?username=${encodeURIComponent(success.username)}&token=${encodeURIComponent(success.token)}`}
            className="inline-block rounded-full bg-brand px-6 py-2.5 font-bold text-white hover:bg-brand-dark"
          >
            Reset Password
          </Link>
          <p className="text-xs text-green-700">
            Demo mode: token is shown here instead of email.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
