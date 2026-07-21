import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Logo from './Logo';
import api from '../../lib/axios';

export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasStatusNotification, setHasStatusNotification] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;

    const checkOrderStatusChanges = async (isPageLoad = false) => {
      try {
        const res = await api.get('/orders');
        const orders = res.data.orders ?? [];
        
        // Load the stored order status map: orderId -> status
        const storedMapStr = localStorage.getItem('customer_order_status_map');
        const storedMap: Record<number, string> = storedMapStr ? JSON.parse(storedMapStr) : {};

        let hasChange = false;
        const currentMap: Record<number, string> = {};

        orders.forEach((order: any) => {
          currentMap[order.id] = order.status;
          
          // If the order existed and its status changed, trigger notification
          if (storedMap[order.id] && storedMap[order.id] !== order.status) {
            hasChange = true;
          }
        });

        if (location.pathname === '/customer/orders') {
          if (isPageLoad) {
            localStorage.setItem('customer_order_status_map', JSON.stringify(currentMap));
            setHasStatusNotification(false);
          } else if (hasChange) {
            setHasStatusNotification(true);
          }
        } else if (hasChange) {
          setHasStatusNotification(true);
        } else {
          // Keep stored map up-to-date with any new/cancelled/completed orders
          const newMap = { ...storedMap, ...currentMap };
          localStorage.setItem('customer_order_status_map', JSON.stringify(newMap));
        }
      } catch (err) {
        console.error('Failed to check order statuses:', err);
      }
    };

    const isEnteringOrdersPage = location.pathname === '/customer/orders' && prevPath !== '/customer/orders';
    setPrevPath(location.pathname);

    checkOrderStatusChanges(isEnteringOrdersPage);

    const interval = setInterval(() => checkOrderStatusChanges(false), 15000);
    return () => clearInterval(interval);
  }, [location.pathname, user, prevPath]);

  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/90 shadow-nav backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="flex items-center gap-1 sm:gap-2">
          {/* My Orders: Always visible (mobile and desktop) */}
          <Link
            to="/customer/orders"
            className="relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand"
            title="My Orders"
          >
            <div className="relative">
              <Package className="h-5 w-5" />
              {hasStatusNotification && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </div>
            <span className="hidden md:inline">Orders</span>
          </Link>

          {/* Cart: Always visible (mobile and desktop) */}
          <Link
            to="/customer/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition hover:bg-brand/20"
            title="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Profile: Desktop view only */}
          <Link
            to="/customer/profile"
            className="hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand"
            title="Profile"
          >
            <User className="h-4 w-4" />
            <span>{user?.fullname?.split(' ')[0]}</span>
          </Link>

          {/* Logout: Desktop view only */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>

          {/* Hamburger Menu Toggle Button: Mobile only */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex sm:hidden h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown: Mobile only */}
      {isMenuOpen && (
        <div className="border-t border-green-50 bg-white px-4 py-2 shadow-lg sm:hidden">
          <div className="flex flex-col space-y-2 py-2">
            <Link
              to="/customer/profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand"
            >
              <User className="h-5 w-5" />
              <span>User Profile ({user?.fullname})</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
