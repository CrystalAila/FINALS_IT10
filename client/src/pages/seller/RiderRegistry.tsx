import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import type { Rider } from '../../types/marketplace';
import { SearchIcon } from '../../components/common/SearchIcon';

const RiderRegistry: React.FC = () => {
  const toast = useToast();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add rider form state
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit rider modal state
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [editFullname, setEditFullname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const res = await api.get('/seller/riders');
      setRiders(res.data.riders);
    } catch (err: any) {
      setError('Failed to fetch riders from registry.');
      toast.error('Failed to load riders.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRiders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return riders;
    return riders.filter((r) =>
      r.fullname.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      (r.user?.username && r.user.username.toLowerCase().includes(q))
    );
  }, [riders, searchQuery]);

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ''),
    [photoFile]
  );

  const editPhotoPreview = useMemo(
    () => (editPhotoFile ? URL.createObjectURL(editPhotoFile) : ''),
    [editPhotoFile]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullname.trim() || !phone.trim() || !username.trim() || !password.trim()) {
      setError('Full name, username, password, and phone number are required.');
      toast.error('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullname', fullname.trim());
      formData.append('username', username.trim());
      formData.append('password', password.trim());
      formData.append('phone', phone.trim());
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.post('/seller/riders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setRiders((current) => [res.data.rider, ...current]);
      setShowForm(false);
      setFullname('');
      setUsername('');
      setPassword('');
      setPhone('');
      setPhotoFile(null);
      toast.success('Rider added successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to save rider.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (rider: Rider) => {
    setEditingRider(rider);
    setEditFullname(rider.fullname || '');
    setEditPhone(rider.phone || '');
    setEditUsername(rider.user?.username || '');
    setEditPassword('');
    setEditPhotoFile(null);
    setEditError(null);
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingRider) return;
    setEditError(null);

    if (!editFullname.trim() || !editPhone.trim()) {
      setEditError('Full name and phone number are required.');
      toast.error('Full name and phone number are required.');
      return;
    }

    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullname', editFullname.trim());
      formData.append('phone', editPhone.trim());
      if (editUsername.trim()) {
        formData.append('username', editUsername.trim());
      }
      if (editPassword.trim()) {
        formData.append('password', editPassword.trim());
      }
      if (editPhotoFile) {
        formData.append('photo', editPhotoFile);
      }

      const res = await api.post(`/seller/riders/${editingRider.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedRider = res.data.rider;
      setRiders((prev) => prev.map((r) => (r.id === editingRider.id ? updatedRider : r)));
      setEditingRider(null);
      toast.success('Rider updated successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to update rider.';
      setEditError(errMsg);
      toast.error(errMsg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from your rider registry?`)) return;
    try {
      await api.delete(`/seller/riders/${id}`);
      setRiders((current) => current.filter((r) => r.id !== id));
      toast.success(`"${name}" removed from registry.`);
    } catch (err: any) {
      toast.error('Failed to delete rider.');
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Rider Registry</h1>
        <button
          type="button"
          onClick={() => setShowForm((show) => !show)}
          className="inline-flex items-center justify-center rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition"
        >
          {showForm ? 'Cancel' : 'Add Rider'}
        </button>
      </div>

      {/* Real-time search bar */}
      <div className="mb-6 flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search riders by name, phone, username..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {showForm && (
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Rider</h2>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="riderFullname" className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="riderFullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="riderUsername" className="block text-xs font-semibold text-slate-700">
                Username (Login) <span className="text-red-500">*</span>
              </label>
              <input
                id="riderUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="riderPassword" className="block text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="riderPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="riderPhone" className="block text-xs font-semibold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="riderPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="riderPhoto" className="block text-xs font-semibold text-slate-700">
                Photo (Optional)
              </label>
              <input
                id="riderPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:outline-none"
              />
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="mt-2 h-32 w-32 rounded-2xl object-cover border border-slate-200" />
              )}
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Rider'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading riders...</p>
      ) : riders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No riders registered yet.</p>
        </div>
      ) : filteredRiders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No riders match your search.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm font-semibold text-brand hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRiders.map((rider) => (
            <div key={rider.id} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-44 overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img
                    src={rider.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                    alt={rider.fullname}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{rider.fullname}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">@{rider.user?.username || 'rider'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <span className="ml-1.5 font-semibold text-slate-800">{rider.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit and Delete */}
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => openEditModal(rider)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand hover:border-brand hover:text-white transition shadow-2xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rider.id, rider.fullname)}
                  className="rounded-xl border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition shadow-2xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Rider Modal */}
      {editingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Rider</h3>
              <button
                type="button"
                onClick={() => setEditingRider(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username (Login)</label>
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Update Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white focus:outline-none"
                />
                {editPhotoPreview && (
                  <img src={editPhotoPreview} alt="New preview" className="mt-2 h-24 w-24 rounded-2xl object-cover border" />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-5 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RiderRegistry;
