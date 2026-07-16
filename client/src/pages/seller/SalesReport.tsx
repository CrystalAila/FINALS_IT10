import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { formatPrice } from '../../types/marketplace';

type SalesSummary = {
  total_revenue: number;
  orders_completed: number;
  items_sold: number;
};

type CategoryData = {
  category: string;
  revenue: number;
};

type TopProduct = {
  id: number;
  name: string;
  image: string | null;
  category: string;
  qty_sold: number;
  revenue: number;
};

type RecentTransaction = {
  id: number;
  customer_name: string;
  items_count: number;
  total: number;
  date: string;
};

export default function SalesReport() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/seller/sales-report');
        setSummary(res.data.summary);
        setCategories(res.data.categories);
        setTopProducts(res.data.top_products);
        setRecentTransactions(res.data.recent_transactions);
      } catch (err) {
        console.error('Failed to load sales report:', err);
        setError('Failed to load sales report details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'broiler':
        return 'Broiler Chicken';
      case 'native':
        return 'Native Chicken';
      case 'eggs':
        return 'Eggs';
      case 'dressed_chicken':
        return 'Dressed Chicken';
      default:
        return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'broiler':
        return 'bg-brand';
      case 'native':
        return 'bg-amber-500';
      case 'eggs':
        return 'bg-yellow-500';
      case 'dressed_chicken':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2"></span>
          Generating sales report...
        </div>
      </Layout>
    );
  }

  if (error || !summary) {
    return (
      <Layout>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p className="font-semibold">{error || 'An error occurred.'}</p>
        </div>
      </Layout>
    );
  }

  const maxCategoryRevenue = Math.max(...categories.map((c) => Number(c.revenue)), 1);

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Business analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sales Report</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Track your completed order performance, revenue statistics, and product distributions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-brand">{formatPrice(Number(summary.total_revenue))}</p>
          <p className="mt-1 text-xs text-slate-500">From all completed orders</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orders Completed</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.orders_completed}</p>
          <p className="mt-1 text-xs text-slate-500">Successfully fulfilled deliveries/pickups</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Items Sold</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.items_sold}</p>
          <p className="mt-1 text-xs text-slate-500">Total volume of chicken/eggs sold</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue by Category</h2>
          <div className="space-y-6">
            {categories.map((c) => {
              const rev = Number(c.revenue);
              const percentage = (rev / maxCategoryRevenue) * 100;
              return (
                <div key={c.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{getCategoryLabel(c.category)}</span>
                    <span className="font-bold text-slate-900">{formatPrice(rev)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCategoryColor(c.category)} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Top Selling Listings</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No sales items yet.</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                    <img src={p.image || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100'} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate text-sm">{p.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{getCategoryLabel(p.category)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{formatPrice(p.revenue)}</p>
                    <p className="text-xs text-slate-500">{p.qty_sold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Sales Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4 text-center">Items Qty</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-4 font-semibold text-slate-950">#{t.id}</td>
                      <td className="py-4 text-slate-600">{t.date}</td>
                      <td className="py-4 text-slate-900">{t.customer_name}</td>
                      <td className="py-4 text-center text-slate-700">{t.items_count}</td>
                      <td className="py-4 text-right font-bold text-slate-950">{formatPrice(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
