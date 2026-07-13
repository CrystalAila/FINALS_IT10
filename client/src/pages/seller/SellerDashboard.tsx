import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';

const metricCards = [
  { title: 'Total Sales', value: '₱68,430', description: 'Monthly revenue across all listings' },
  { title: 'Pending Orders', value: '12', description: 'Orders awaiting pickup or delivery' },
  { title: 'Low Stock', value: '5', description: 'Products below reorder threshold' },
];

const SellerDashboard: React.FC = () => {
  const location = useLocation();
  const [cards] = useState(metricCards);
  const message = (location.state as { message?: string } | null)?.message;

  return (
    <Layout>
      {message && (
        <div className="mb-6 rounded-3xl border border-brand/20 bg-brand/10 p-5 text-sm text-brand">
          {message}
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
