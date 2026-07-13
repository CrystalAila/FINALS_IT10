import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, Search, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Logo from './Logo';

type CustomerNavbarProps = {
  onSearch?: (query: string) => void;
};

export default function CustomerNavbar({ onSearch }: CustomerNavbarProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    if (!onSearch && query.trim()) {
      navigate(`/customer?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/90 shadow-nav backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 sm:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search poultry products, farms..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            to="/customer/orders"
            className="hidden items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand sm:inline-flex"
            title="My Orders"
          >
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Orders</span>
          </Link>

          <Link
            to="/customer/profile"
            className="hidden items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand sm:inline-flex"
            title="Profile"
          >
            <User className="h-4 w-4" />
            <span className="hidden md:inline">{user?.fullname?.split(' ')[0]}</span>
          </Link>

          <Link
            to="/customer/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition hover:bg-brand/20"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
