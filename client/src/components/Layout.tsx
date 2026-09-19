import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import { SearchIcon } from './common/SearchIcon';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, logActivity } = useAuth();
  const location = useLocation();
  const [hasNewOrderNotification, setHasNewOrderNotification] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (user && logActivity) {
      logActivity(`Visited ${location.pathname}`);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role !== 'seller' && user?.role !== 'reseller') return;

    const checkNewOrders = async (isTransition = false) => {
      try {
        const res = await api.get('/seller/orders');
        const orders = res.data.orders ?? [];
        const currentCount = orders.length;

        const lastSeen = localStorage.getItem('seller_last_seen_order_count');
        const lastSeenCount = lastSeen ? parseInt(lastSeen, 10) : null;

        const isViewingOrders = location.pathname === '/seller/orders' || location.pathname.startsWith('/seller/orders/') ||
                                location.pathname === '/reseller/orders' || location.pathname.startsWith('/reseller/orders/');

        if (isViewingOrders) {
          localStorage.setItem('seller_last_seen_order_count', String(currentCount));
          setHasNewOrderNotification(false);
        } else {
          if (lastSeenCount !== null && currentCount > lastSeenCount) {
            setHasNewOrderNotification(true);
          } else if (lastSeenCount === null) {
            localStorage.setItem('seller_last_seen_order_count', String(currentCount));
          }
        }
      } catch (err) {
        console.error('Failed to check seller orders:', err);
      }
    };

    const wasViewingOrders = prevPathRef.current === '/seller/orders' || prevPathRef.current.startsWith('/seller/orders/') ||
                             prevPathRef.current === '/reseller/orders' || prevPathRef.current.startsWith('/reseller/orders/');
    const isViewingOrders = location.pathname === '/seller/orders' || location.pathname.startsWith('/seller/orders/') ||
                            location.pathname === '/reseller/orders' || location.pathname.startsWith('/reseller/orders/');
    const hasTransitioned = isViewingOrders && !wasViewingOrders;

    prevPathRef.current = location.pathname;

    checkNewOrders(hasTransitioned);

    const interval = setInterval(() => checkNewOrders(false), 15000);
    return () => clearInterval(interval);
  }, [location.pathname, user]);

  const basePath = user?.role === 'customer' ? '/customer' : user ? `/${user.role}` : '/';
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : `${basePath}/dashboard`;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className="w-72 border-r border-emerald-900/30 text-white px-5 py-6 shadow-sm flex flex-col justify-between"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white font-bold text-base tracking-wider">PL</div>
              <div>
                <p className="text-lg font-semibold text-white">Poultry Link</p>
                <p className="text-sm text-emerald-100">Modern ag marketplace</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                to={dashboardPath}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive(dashboardPath) ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
              >
                Dashboard
              </Link>
              {(user?.role === 'seller' || user?.role === 'reseller') && (
                <>
                  {user.status !== 'verified' && (
                    <Link
                      to="/seller/verification"
                      className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/verification') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                    >
                      Account Verification
                    </Link>
                  )}
                  <Link
                    to="/seller/shop"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/shop') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Shop Configuration
                  </Link>
                  {user.status === 'verified' && (
                    <>
                      <Link
                        to="/seller/listings"
                        className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/listings') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                      >
                        My Listings
                      </Link>
                      <Link
                        to="/seller/orders"
                        onClick={() => setHasNewOrderNotification(false)}
                        className={`relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/orders') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                      >
                        <span>Orders</span>
                        {hasNewOrderNotification && (
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                        )}
                      </Link>
                      <Link
                        to="/seller/riders"
                        className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/riders') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                      >
                        Rider Registry
                      </Link>
                      <Link
                        to="/seller/sales-report"
                        className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/seller/sales-report') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                      >
                        Sales Report
                      </Link>
                    </>
                  )}
                </>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/users"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/users') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    User Management
                  </Link>
                  <Link
                    to="/admin/permits"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/permits') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Permits Verifications
                  </Link>
                  <Link
                    to="/admin/market"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/market') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Market Monitoring
                  </Link>
                  <Link
                    to="/admin/reports"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/reports') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Reports
                  </Link>
                  <Link
                    to="/admin/logs"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/logs') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Audit Logs
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive('/admin/settings') ? 'bg-white/20 text-white font-semibold shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'}`}
                  >
                    System Settings
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="mt-8">
            <div className="rounded-3xl bg-white/15 p-4 text-sm text-white">
              <p className="font-semibold text-white/90">Current role</p>
              <p className="mt-1 capitalize text-emerald-100">{user?.role}</p>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="mt-4 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Logout
            </button>
          </div>
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
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span className="hidden rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand sm:inline-flex">
                {(user?.role === 'seller' || user?.role === 'reseller') ? (user?.role === 'seller' ? 'Seller' : 'Reseller') : user?.role}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand font-bold text-sm uppercase">
                {user?.fullname ? user.fullname.charAt(0) : 'U'}
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
