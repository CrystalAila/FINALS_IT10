import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
          {/* My Orders */}
          <Link
            to="/customer/orders"
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
              location.pathname === '/customer/orders' || location.pathname.startsWith('/customer/orders/')
                ? 'bg-green-50 text-[#D96B27] font-semibold'
                : 'text-gray-600 hover:bg-green-50 hover:text-[#D96B27]'
            }`}
            title="My Orders"
          >
            <span>Orders</span>
            {hasStatusNotification && (
              <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/customer/cart"
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
              location.pathname === '/customer/cart'
                ? 'bg-green-50 text-[#D96B27] font-semibold'
                : 'text-gray-600 hover:bg-green-50 hover:text-[#D96B27]'
            }`}
            title="Cart"
          >
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D96B27] px-1.5 text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Profile */}
          <Link
            to="/customer/profile"
            className={`hidden sm:inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium transition ${
              location.pathname === '/customer/profile'
                ? 'bg-green-50 text-[#D96B27] font-semibold'
                : 'text-gray-600 hover:bg-green-50 hover:text-[#D96B27]'
            }`}
            title="Profile"
          >
            <span>{user?.fullname?.split(' ')[0]}</span>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
            title="Logout"
          >
            Logout
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex sm:hidden rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="border-t border-green-50 bg-white px-4 py-2 shadow-lg sm:hidden">
          <div className="flex flex-col space-y-2 py-2">
            <Link
              to="/customer/profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-brand"
            >
              <span>Profile ({user?.fullname})</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

