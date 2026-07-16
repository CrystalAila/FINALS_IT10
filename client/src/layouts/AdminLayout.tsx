import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, logActivity } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && logActivity) {
      logActivity(`Admin visited ${location.pathname}`);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AdminSidebar user={user} logout={logout} />

        <div className="flex-1 px-6 py-6">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Hello,</p>
              <p className="text-xl font-semibold text-slate-900">{user?.fullname}</p>
            </div>
            <div className="flex flex-1 items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 max-w-2xl">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search marketplace..."
                onChange={() => {}}
              />
              <span className="text-slate-400">🔎</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 sm:inline-flex">Admin</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 text-lg font-bold">👤</div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
