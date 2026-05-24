import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
  role: 'customer' as User['role'],
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
    <div style={{ padding: '2rem' }}>
        <div style={{ padding: '2rem 4rem', width: '100vw', boxSizing: 'border-box', marginLeft: '50%', transform: 'translateX(-50%)' }}>
        <div className="page-heading" style={{ marginBottom: '2rem' }}>
            <div>
            <div className="status-pill success" style={{ display: 'inline-block' }}>Admin user management</div>
            <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>User Management</h2>
            <p style={{ color: '#6b7280' }}>View, add, edit and delete users for Capiz PoultryLink.</p>
            </div>
        </div>

        <div className="admin-layout" style={{ width: '100%', display: 'block' }}>
            <main className="card" style={{ minHeight: 420, width: '100%', padding: '2.5rem', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>All Users</h3>
                <Link to="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-block' }}>Back to dashboard</Link>
                </div>
                <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={() => {
                    resetForm();
                    setModalMode('add');
                    setSelectedUser(null);
                    setShowModal(true);
                }}
                style={{ padding: '0.75rem 1.75rem', fontWeight: 'bold' }}
                >
                + Add User
                </button>
            </div>
            
            <div style={{ width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Role</th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((userItem) => (
                    <tr key={userItem.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1.25rem 1rem' }}>{userItem.fullname}</td>
                        <td style={{ padding: '1.25rem 1rem' }}>{userItem.username}</td>
                        <td style={{ padding: '1.25rem 1rem', textTransform: 'capitalize' }}>{userItem.role}</td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEdit(userItem)}
                            style={{ marginRight: '0.5rem' }}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(userItem.id)}
                            disabled={user?.id === userItem.id}
                        >
                            Delete
                        </button>
                        </td>
                    </tr>
                    ))}
                    {users.length === 0 ? (
                    <tr>
                        <td colSpan={4} style={{ padding: '3rem 0', color: '#6b7280', textAlign: 'center' }}>
                        {loading ? 'Loading users …' : 'No users found.'}
                        </td>
                    </tr>
                    ) : null}
                </tbody>
                </table>
            </div>
            </main>

    <aside className="card" style={{ display: 'none' }} />
  </div>
</div>

      {showModal ? (
        <div className="modal-backdrop" onClick={() => { setShowModal(false); setSelectedUser(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modalMode === 'confirm' ? (
              <div>
                <h3 className="card-title">Confirm delete</h3>
                <p>Are you sure you want to delete <strong>{selectedUser?.fullname}</strong>?</p>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedUser(null); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmDelete} disabled={loading} style={{ marginLeft: '0.75rem' }}>Delete</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="card-title">{modalMode === 'add' ? 'Add User' : 'Edit User'}</h3>
                {error && <div className="alert">{error}</div>}
                {success && <div className="card-copy" style={{ color: '#064e3b', marginBottom: '1rem' }}>{success}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullname">Full name</label>
                    <input
                      id="fullname"
                      value={form.fullname}
                      onChange={(e) => setField('fullname', e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">Username</label>
                    <input
                      id="username"
                      value={form.username}
                      onChange={(e) => setField('username', e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group password-field-wrapper">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                      className="form-control"
                      placeholder={form.id ? 'Leave blank to keep current password' : 'Enter a password'}
                      {...(!form.id ? { required: true } : {})}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">Role</label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => setField('role', e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="customer">Customer</option>
                      <option value="reseller">Reseller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {form.id ? 'Save changes' : 'Create user'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedUser(null); }} style={{ marginLeft: '0.75rem' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminUsers;
