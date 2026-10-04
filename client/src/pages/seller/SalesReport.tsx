import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { formatPrice, resolveProductImage } from '../../types/marketplace';
import PrintIcon from '../../components/common/PrintIcon';

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
  const { user } = useAuth();
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
      case 'live_poultry':
        return 'Live Poultry';
      case 'dressed_meat':
        return 'Dressed Meat';
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
      case 'live_poultry':
        return 'bg-emerald-600';
      case 'dressed_meat':
        return 'bg-rose-500';
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

  const totalRev = Number(summary.total_revenue);

  return (
    <Layout>
      {/* SCREEN VIEW (HIDDEN ON PRINT) */}
      <div className="print:hidden">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-brand hover:border-brand/40 transition cursor-pointer self-start sm:self-auto"
          >
            <PrintIcon className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-brand">{formatPrice(Number(summary.total_revenue))}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orders Completed</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.orders_completed}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Items Sold</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.items_sold}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Category breakdown */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue by Category</h2>
            <div className="space-y-6">
              {categories.map((c) => {
                const rev = Number(c.revenue);
                const percentage = totalRev > 0 ? (rev / totalRev) * 100 : 0;
                return (
                  <div key={c.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {getCategoryLabel(c.category)}
                        {totalRev > 0 && rev > 0 && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            ({percentage.toFixed(0)}%)
                          </span>
                        )}
                      </span>
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
                      <img
                        src={resolveProductImage(p.image, p.category)}
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.src = resolveProductImage(null, p.category);
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-sm capitalize">{p.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{getCategoryLabel(p.category)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">{formatPrice(Number(p.revenue))}</p>
                      <p className="text-xs text-slate-500">{p.qty_sold} {p.qty_sold === 1 ? 'unit' : 'units'} sold</p>
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
                        <td className="py-4 text-right font-bold text-slate-950">{formatPrice(Number(t.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FORMAL PRINT REPORT LAYOUT (PLAIN WHITE, FORMAL HEADERS, NO COLOR CARDS) */}
      <div className="hidden print:block text-slate-900 bg-white font-sans text-xs p-2">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">PoultryLink Agricultural Marketplace</p>
              <h1 className="text-xl font-bold uppercase text-slate-950 mt-0.5">
                {user?.business_name || user?.fullname || 'Seller Store'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Owner / Seller: <span className="font-semibold text-slate-800">{user?.fullname}</span>
                {user?.phone ? <span> &bull; Phone: {user.phone}</span> : null}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900">
                Daily Sales Report
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Date: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-600">
                Time: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Summary Totals */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            I. Summary Totals
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Total Gross Revenue</td>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 w-1/4 text-sm">{formatPrice(totalRev)}</td>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Completed Orders</td>
                <td className="p-2.5 font-bold text-slate-900 w-1/4 text-sm">{summary.orders_completed}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Total Items / Units Sold</td>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">{summary.items_sold}</td>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Average Order Value</td>
                <td className="p-2.5 font-bold text-slate-900">
                  {formatPrice(summary.orders_completed > 0 ? totalRev / summary.orders_completed : 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Category Breakdown */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            II. Revenue Breakdown by Category
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold">Category</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Share of Revenue (%)</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Total Revenue (₱)</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-2 text-center text-slate-500 border border-slate-300">No category sales recorded.</td>
                </tr>
              ) : (
                categories.map((c) => {
                  const rev = Number(c.revenue);
                  const percentage = totalRev > 0 ? (rev / totalRev) * 100 : 0;
                  return (
                    <tr key={c.category} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 font-medium">{getCategoryLabel(c.category)}</td>
                      <td className="p-2 border border-slate-300 text-right">{percentage.toFixed(1)}%</td>
                      <td className="p-2 border border-slate-300 text-right font-semibold">{formatPrice(rev)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                <td className="p-2 border border-slate-400">Total</td>
                <td className="p-2 border border-slate-400 text-right">100.0%</td>
                <td className="p-2 border border-slate-400 text-right">{formatPrice(totalRev)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 3: Itemized Sales Performance */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            III. Itemized Listing Sales Performance
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-center w-10 font-semibold">#</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Listing / Product Name</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Category</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Units Sold</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Total Revenue (₱)</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-500 border border-slate-300">No item sales recorded.</td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={p.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-medium capitalize">{p.name}</td>
                    <td className="p-2 border border-slate-300 text-slate-700">{getCategoryLabel(p.category)}</td>
                    <td className="p-2 border border-slate-300 text-center">{p.qty_sold}</td>
                    <td className="p-2 border border-slate-300 text-right font-semibold">{formatPrice(Number(p.revenue))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: Recent Completed Transactions */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            IV. Completed Transactions Log
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold">Order ID</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Date & Time</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Customer</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Items Qty</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Total Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-500 border border-slate-300">No transactions recorded yet.</td>
                </tr>
              ) : (
                recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-semibold">#{t.id}</td>
                    <td className="p-2 border border-slate-300 text-slate-700">{t.date}</td>
                    <td className="p-2 border border-slate-300">{t.customer_name}</td>
                    <td className="p-2 border border-slate-300 text-center">{t.items_count}</td>
                    <td className="p-2 border border-slate-300 text-right font-semibold">{formatPrice(Number(t.total))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures & Certification */}
        <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-400">
          <div>
            <p className="text-[11px] text-slate-600 mb-10">Prepared & Certified Correct by:</p>
            <div className="border-b border-slate-800 w-4/5 mb-1"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">{user?.fullname || 'Authorized Seller'}</p>
            <p className="text-[11px] text-slate-500">Store Owner / Farm Representative</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-600 mb-10">Verified / Recorded by:</p>
            <div className="border-b border-slate-800 w-4/5 mb-1"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">Accounting / Management</p>
            <p className="text-[11px] text-slate-500">Date: _______________________</p>
          </div>
        </div>

        {/* Formal Notice */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          PoultryLink Agri-Marketplace System &bull; Official Daily Sales Report &bull; Computer Generated
        </div>
      </div>
    </Layout>
  );
}

