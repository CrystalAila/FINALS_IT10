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
    <div className="min-h-screen bg-slate-50 print:bg-white text-slate-900">
      <div className="flex min-h-screen">
        <AdminSidebar user={user} logout={logout} />

        <div className="flex-1 px-6 py-6 print:p-0 print:m-0 print:w-full">

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
