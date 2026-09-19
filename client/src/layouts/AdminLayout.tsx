import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import SearchIcon from '../components/common/SearchIcon';

interface AdminLayoutProps {
  children: React.ReactNode;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search marketplace...',
}) => {
  const { user, logout, logActivity } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    if (user && logActivity) {
      logActivity(`Admin visited ${location.pathname}`);
    }
  }, [location.pathname]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = searchTerm !== undefined ? searchTerm : localSearch;
      if (!onSearchChange) {
        navigate(`/admin/market?search=${encodeURIComponent(term)}`);
      }
    }
  };

  const currentSearchValue = searchTerm !== undefined ? searchTerm : localSearch;

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
            <div className="flex flex-1 items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 max-w-2xl">
              <SearchIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder={searchPlaceholder}
                value={currentSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Admin</span>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
