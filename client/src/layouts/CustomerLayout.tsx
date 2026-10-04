import { Outlet, useLocation } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';

export default function CustomerLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/customer' || location.pathname === '/customer/';

  return (
    <div className="min-h-screen bg-customer-bg">
      <CustomerNavbar />
      <main className={isHomePage ? 'w-full' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>
    </div>
  );
}
