import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [fullname, setFullname] = useState(user?.fullname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname);
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, string> = { fullname, email, phone };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
        payload.current_password = currentPassword;
      }
      await updateProfile(payload);
      setMessage('Profile updated successfully.');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">@{user?.username}</p>
        </div>
      </div>

      {message && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
          <input
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {!user?.google_id && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Change password (optional)</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                minLength={6}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand px-8 py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/customer/orders"
          className="rounded-full border-2 border-brand px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
        >
          My Orders
        </Link>
        <Link
          to="/customer/addresses"
          className="rounded-full border-2 border-brand px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
        >
          Address Book
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
