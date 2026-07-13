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
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/permits', label: 'Permits Verifications', icon: '✓' },
    { path: '/admin/market', label: 'Market Monitoring', icon: '📈' },
    { path: '/admin/reports', label: 'Reports', icon: '📋' },
    { path: '/admin/logs', label: 'Audit Logs', icon: '📝' },
    { path: '/admin/settings', label: 'System Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-72 border-r border-emerald-900 bg-emerald-950 text-emerald-100 px-5 py-6 shadow-sm flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-800 text-white text-2xl font-bold">🐓</div>
        <div>
          <p className="text-lg font-semibold text-white">Poultry Link</p>
          <p className="text-xs text-emerald-200">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive(item.path)
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-emerald-100 hover:bg-emerald-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="mt-10 space-y-4">
        <div className="rounded-3xl bg-emerald-900 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-300">Current Admin</p>
          <p className="mt-2 font-semibold text-white capitalize">{user?.fullname}</p>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-2xl border border-emerald-700 bg-emerald-900/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
