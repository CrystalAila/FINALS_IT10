import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

type User = {
  id: number;
  fullname: string;
  username: string;
  role: 'customer' | 'seller' | 'reseller' | 'admin' | 'rider';
  created_at: string;
  updated_at: string;
  status?: string;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_rider?: boolean;
  farm?: {
    name: string;
    location: string;
    description: string;
    permit_file?: string | null;
    permit_status?: string | null;
    permit_issue_date?: string | null;
    permit_expiry_date?: string | null;
  } | null;
};

const AdminUsers = () => {
  const { logActivity } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const handleViewDetails = async (userItem: User) => {
    setSelectedUser(userItem);
    setShowDetailsModal(true);
    await logActivity(`Viewed details for user: ${userItem.username}`);
  };

  const getRoleLabelColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'seller':
      case 'reseller':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rider':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">User Management</p>
          <h1 className="mt-3 text-3xl font-semibold">System user registry</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            View detailed profiles of registered sellers, verified riders, and administrative managers of PoultryLink.
          </p>
        </div>

        {/* User List Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">System registry listing</p>
              <h2 className="text-2xl font-semibold text-slate-900">Registered Users ({users.length})</h2>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh listing'}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Username / Phone</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Registered At</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{userItem.fullname}</td>
                    <td className="py-3 px-4 text-slate-600">{userItem.username}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded-2xl border px-3 py-1 text-xs font-semibold ${getRoleLabelColor(userItem.role)}`}>
                        {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
                        onClick={() => handleViewDetails(userItem)}
                      >
                        + View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-600">
                      {loading ? 'Loading system users…' : 'No users registered.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className={`inline-block rounded-2xl border px-3 py-1 text-xs font-semibold uppercase ${getRoleLabelColor(selectedUser.role)}`}>
                  {selectedUser.role} Profile
                </span>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{selectedUser.fullname}</h3>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Account Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Account Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-medium">Username / ID</p>
                    <p className="font-semibold text-slate-800">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Account Status</p>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 uppercase ${
                      selectedUser.status === 'verified' || selectedUser.status === 'active'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedUser.status === 'suspended'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {selectedUser.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Email Address</p>
                    <p className="font-semibold text-slate-800">{selectedUser.email || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Phone Number</p>
                    <p className="font-semibold text-slate-800">{selectedUser.phone || 'None'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 font-medium">Date Registered</p>
                    <p className="font-semibold text-slate-800">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shop/Farm Details (Sellers only) */}
              {(selectedUser.role === 'seller' || selectedUser.role === 'reseller') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Shop / Farm Details</h4>
                  {selectedUser.farm ? (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <div className="col-span-2">
                        <p className="text-slate-400 font-medium">Business Name</p>
                        <p className="font-bold text-emerald-950 text-base">{selectedUser.farm.name}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 font-medium">Shop Location</p>
                        <p className="font-semibold text-slate-800">{selectedUser.farm.location}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 font-medium">Description</p>
                        <p className="text-slate-600 text-xs italic">{selectedUser.farm.description || 'No description provided'}</p>
                      </div>
                      {selectedUser.farm.permit_issue_date && (
                        <div>
                          <p className="text-slate-400 font-medium">Permit Issued</p>
                          <p className="font-semibold text-slate-800">
                            {new Date(selectedUser.farm.permit_issue_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedUser.farm.permit_expiry_date && (
                        <div>
                          <p className="text-slate-400 font-medium">Permit Expiry</p>
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {new Date(selectedUser.farm.permit_expiry_date).toLocaleDateString()}
                            {new Date(selectedUser.farm.permit_expiry_date) < new Date() && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700 font-bold animate-pulse">EXPIRED</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      No farm details configured for this seller yet.
                    </p>
                  )}
                </div>
              )}

              {/* Rider Registry Details (Riders only) */}
              {selectedUser.role === 'rider' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Rider Affiliation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <div>
                      <p className="text-slate-400 font-medium">Rider Phone</p>
                      <p className="font-semibold text-slate-800">{selectedUser.phone || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Affiliated Shop / Farm</p>
                      <p className="font-semibold text-slate-800">
                        {selectedUser.farm?.name || 'Independent Rider'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
