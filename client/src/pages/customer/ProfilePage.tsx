import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, logout, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState(user?.fullname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    try {
      const payload: Record<string, string> = { fullname, email, phone };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
        payload.current_password = currentPassword;
      }
      await updateProfile(payload);
      toast.success('Profile updated successfully.');
      setIsEditing(false);
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to update profile.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-lg">
            {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">@{user?.username}</p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {!isEditing ? (
        /* Read-only Profile Overview */
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Full Name</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user?.fullname || 'Not set'}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Username</span>
              <p className="mt-1 text-base font-semibold text-gray-900">@{user?.username}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user?.email || 'None'}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Phone Number</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user?.phone || 'None'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <Link
              to="/customer/addresses"
              className="text-sm font-semibold text-brand hover:underline"
            >
              Manage Address Book →
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-5 py-2 text-sm font-semibold text-white shadow-sm transition"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Profile Details</h2>

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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
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

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/customer/addresses"
          className="rounded-full border-2 border-brand px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
        >
          Address Book
        </Link>
      </div>
    </div>
  );
}
