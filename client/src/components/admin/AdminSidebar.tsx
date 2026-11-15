import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface User {
  id?: number;
  fullname?: string;
  role?: string;
}

interface AdminSidebarProps {
  user: User | null;
  logout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, logout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/shares', label: 'Admin Shares (5%)' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/permits', label: 'Permits Verifications' },
    { path: '/admin/riders', label: 'Rider Approvals' },
    { path: '/admin/market', label: 'Market Monitoring' },
    { path: '/admin/reports', label: 'Reports' },
    { path: '/admin/logs', label: 'Audit Logs' },
    { path: '/admin/settings', label: 'System Settings' },
  ];

  return (
    <aside
      className="w-72 border-r border-emerald-900/30 text-white px-5 py-6 shadow-sm flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 z-30 print:hidden"
      style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
    >
      {/* Logo */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1 shadow-sm shrink-0 overflow-hidden">
          <img src="/logo.png" alt="PoultryLink Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-white leading-tight">
            Poultry<span className="text-brand">Link</span>
          </p>
          <p className="text-xs text-emerald-100 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive(item.path)
                ? 'bg-white/20 text-white font-semibold shadow-md'
                : 'text-emerald-50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="mt-10 space-y-4">
        <div className="rounded-3xl bg-white/15 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Current Admin</p>
          <p className="mt-2 font-semibold text-white capitalize">{user?.fullname}</p>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
