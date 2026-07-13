import { Outlet } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-customer-bg">
      <CustomerNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
