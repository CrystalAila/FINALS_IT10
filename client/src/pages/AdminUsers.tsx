import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

type User = {
  id: number;
  fullname: string;
  username: string;
  role: 'customer' | 'reseller' | 'admin';
  created_at: string;
  updated_at: string;
};

const initialForm = {
  id: 0,
  fullname: '',
  username: '',
  password: '',
  role: 'reseller' as User['role'],
};

const AdminUsers = () => {
  const { user, logActivity } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'confirm'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  };

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (userToEdit: User) => {
    setForm({
      id: userToEdit.id,
      fullname: userToEdit.fullname,
      username: userToEdit.username,
      password: '',
      role: userToEdit.role,
    });
    setSelectedUser(userToEdit);
    setModalMode('edit');
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    const userToDelete = users.find((u) => u.id === id) || null;
    setSelectedUser(userToDelete);
    setModalMode('confirm');
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setSuccess('User deleted successfully.');
      await fetchUsers();
      await logActivity(`Deleted user ID ${selectedUser.id}`);
      setShowModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      fullname: form.fullname.trim(),
      username: form.username.trim(),
      password: form.password || undefined,
      role: form.role,
    };

    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}`, payload);
        setSuccess('User updated successfully.');
        await logActivity(`Updated user ${payload.username}`);
      } else {
        await api.post('/admin/users', payload);
        setSuccess('User created successfully.');
        await logActivity(`Created new user ${payload.username}`);
      }

      resetForm();
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err?.response?.data?.message || 'Unable to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">User Management</p>
          <h1 className="mt-3 text-3xl font-semibold">Manage system users</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            View, add, edit and delete users for PoultryLink. Manage customers, sellers, and admin accounts.
          </p>
        </div>

        {/* User List Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">System users</p>
              <h2 className="text-2xl font-semibold text-slate-900">All Users ({users.length})</h2>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
              onClick={() => {
                resetForm();
                setModalMode('add');
                setSelectedUser(null);
                setShowModal(true);
              }}
            >
              + Add User
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 mb-4">
              <p className="text-sm font-semibold text-green-800">{success}</p>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{userItem.fullname}</td>
                    <td className="py-3 px-4 text-slate-600">{userItem.username}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded-2xl px-3 py-1 text-xs font-semibold ${
                        userItem.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : userItem.role === 'reseller'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => handleEdit(userItem)}
                          disabled={userItem.role === 'customer' || userItem.role === 'seller'}
                          title={userItem.role === 'customer' || userItem.role === 'seller' ? 'Cannot edit this role' : ''}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          onClick={() => handleDelete(userItem.id)}
                          disabled={user?.id === userItem.id || userItem.role === 'customer' || userItem.role === 'seller'}
                          title={userItem.role === 'customer' || userItem.role === 'seller' ? 'Cannot delete this role' : ''}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-600">
                      {loading ? 'Loading users…' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {modalMode === 'confirm' ? (
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Confirm Delete</h3>
                <p className="mt-3 text-slate-600">
                  Are you sure you want to delete <strong>{selectedUser?.fullname}</strong>?
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {modalMode === 'add' ? 'Add User' : 'Edit User'}
                </h3>
                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      value={form.fullname}
                      onChange={(e) => setField('fullname', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) => setField('username', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setField('password', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        placeholder={form.id ? 'Leave blank to keep current password' : 'Enter a password'}
                        {...(!form.id ? { required: true } : {})}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setField('role', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="reseller">Reseller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
                      disabled={loading}
                    >
                      {form.id ? 'Save Changes' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedUser(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
