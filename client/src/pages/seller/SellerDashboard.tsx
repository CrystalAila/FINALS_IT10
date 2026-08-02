import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const metricCards = [
  { title: 'Total Sales', value: '₱68,430', description: 'Monthly revenue across all listings' },
  { title: 'Pending Orders', value: '12', description: 'Orders awaiting pickup or delivery' },
  { title: 'Low Stock', value: '5', description: 'Products below reorder threshold' },
];

const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [cards] = useState(metricCards);
  const message = (location.state as { message?: string } | null)?.message;

  // Check if permit is expiring soon
  const getDaysUntilExpiry = () => {
    if (!user || !user.farm || !user.farm.permit_expiry_date) return null;
    const expiryDate = new Date(user.farm.permit_expiry_date);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const daysRemaining = getDaysUntilExpiry();
  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;

  return (
    <Layout>
      {message && (
        <div className="mb-6 rounded-3xl border border-brand/20 bg-brand/10 p-5 text-sm text-brand">
          {message}
        </div>
      )}

      {user && user.status === 'verified' && isExpiringSoon && (
        <div className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 text-orange-800 shadow-sm flex items-start gap-4">
          <div className="text-2xl mt-0.5">🔔</div>
          <div>
            <h3 className="font-semibold text-lg">Business Permit Expiring Soon</h3>
            <p className="mt-1 text-sm text-orange-700">
              Your LGU Business Permit is expiring in <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> (on {new Date(user.farm.permit_expiry_date).toLocaleDateString()}).
              Please renew your permit and upload it in the shop settings to ensure continuous operation of your shop.
            </p>
            <div className="mt-3">
              <Link
                to="/seller/shop"
                className="inline-flex rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 transition"
              >
                Renew Permit & Configure Shop
              </Link>
            </div>
          </div>
        </div>
      )}

      {user && user.status !== 'verified' && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm flex items-start gap-4">
          <div className="text-2xl mt-0.5">⚠️</div>
          <div>
            <h3 className="font-semibold text-lg">Shop Verification Required</h3>
            <p className="mt-1 text-sm text-amber-700">
              Your seller account status is currently <strong className="capitalize">{user.status?.replace('_', ' ') || 'Pending'}</strong>.
              Access to listings, orders, and rider management is disabled until your shop is approved by an administrator.
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                to="/seller/verification"
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
              >
                View Verification Status
              </Link>
              <Link
                to="/seller/shop"
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-50 transition"
              >
                Configure Shop & Permit
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Seller dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your farm shop overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Stay on top of sales, stock levels, and order flow for your PoultryLink shop.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Shop performance</h2>
              <p className="mt-1 text-sm text-slate-500">Fast view of recent trends and market throughput.</p>
            </div>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">Live</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">New customers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">34</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Orders fulfilled</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">48</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Stock health</h2>
              <p className="mt-1 text-sm text-slate-500">A quick check for critical listings and restock needs.</p>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">Attention</span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Broiler chicken</p>
                <span className="text-sm text-slate-500">18 left</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-brand" style={{ width: '22%' }} />
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Free-range eggs</p>
                <span className="text-sm text-slate-500">9 left</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SellerDashboard;
