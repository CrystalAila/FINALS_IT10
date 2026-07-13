import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, logActivity } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && logActivity) {
      logActivity(`Visited ${location.pathname}`);
    }
  }, [location.pathname]);

  const basePath = user?.role === 'customer' ? '/customer' : user ? `/${user.role}` : '/';
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : `${basePath}/dashboard`;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className={`${isAdmin ? 'w-72 border-r border-emerald-900 bg-emerald-950 text-emerald-100' : 'w-72 border-r border-slate-200 bg-white text-slate-900'} px-5 py-6 shadow-sm`}>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand text-2xl">🐓</div>
            <div>
              <p className="text-lg font-semibold">Poultry Link</p>
              <p className="text-sm text-slate-500">Modern ag marketplace</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to={dashboardPath}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive(dashboardPath) ? (isAdmin ? 'bg-emerald-800 text-white shadow-sm' : 'bg-brand/10 text-brand shadow-sm') : (isAdmin ? 'text-emerald-100 hover:bg-emerald-900' : 'text-slate-700 hover:bg-slate-100')}`}
            >
              Dashboard
            </Link>
            {user?.role === 'seller' && (
              <>
                <Link
                  to="/seller/shop"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/shop') ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  Shop Configuration
                </Link>
                <Link
                  to="/seller/listings"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/listings') ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  My Listings
                </Link>
                <Link
                  to="/seller/orders"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/orders') ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  Orders
                </Link>
                <Link
                  to="/seller/riders"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/riders') ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  Rider Registry
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin/users"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/users') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  User Management
                </Link>
                <Link
                  to="/admin/permits"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/permits') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  Permits Verifications
                </Link>
                <Link
                  to="/admin/market"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/market') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  Market Monitoring
                </Link>
                <Link
                  to="/admin/reports"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/reports') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  Reports
                </Link>
                <Link
                  to="/admin/logs"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/logs') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  Audit Logs
                </Link>
                <Link
                  to="/admin/settings"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/settings') ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-900'}`}
                >
                  System Settings
                </Link>
              </>
            )}
          </nav>

          <div className="mt-10 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Current role</p>
            <p className="mt-1 capitalize">{user?.role}</p>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </aside>

        <div className="flex-1 px-6 py-6">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Hello,</p>
              <p className="text-xl font-semibold text-slate-900">{user?.fullname}</p>
            </div>
            <div className="flex flex-1 items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 max-w-2xl">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search seller tools"
                onChange={() => {}}
              />
              <span className="text-slate-400">🔎</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span className="hidden rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand sm:inline-flex">{user?.role === 'seller' ? 'Seller' : user?.role}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand text-lg">🐓</div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
