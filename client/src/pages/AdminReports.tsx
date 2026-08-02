import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verification' | 'sales' | 'orders'>('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/reports/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin reports:', err);
      setError('Failed to load reports summary data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatPHP = (val: number) => {
    return '₱' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin mr-2"></span>
          Loading reports and analytics...
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-semibold text-lg">Error Loading Reports</p>
          <p className="mt-2 text-sm">{error || 'Something went wrong.'}</p>
          <button
            onClick={fetchReport}
            className="mt-4 rounded-xl bg-red-800 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 transition"
          >
            Retry Loading
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Calculate max revenue for chart rendering
  const maxRevenue = Math.max(...(data.chart_data?.map((d: any) => d.revenue) || [1]));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">System Reports</p>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace & Compliance Analytics</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Real-time analytics and statistics across verified sellers, order transactions, compliance reviews, and financial volume.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Total Revenue</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{formatPHP(data.total_revenue)}</p>
            <p className="mt-1 text-xs text-slate-400">Completed order payouts</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Total Orders</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{data.total_orders}</p>
            <p className="mt-1 text-xs text-slate-400">All time transactions</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Total Sellers</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{data.total_sellers}</p>
            <p className="mt-1 text-xs text-slate-400">Registered farm operators</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Verified Sellers</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{data.verified_sellers}</p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              {data.total_sellers > 0 ? Math.round((data.verified_sellers / data.total_sellers) * 100) : 0}% approval rate
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Pending Permits</p>
            <p className="mt-2 text-xl font-bold text-amber-600">{data.pending_permits}</p>
            <p className="mt-1 text-xs text-slate-400">Awaiting compliance review</p>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('sales')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'sales'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">📈</span>
            Sales Volume & Charts
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'verification'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">✓</span>
            Seller & Permit Verification
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">📦</span>
            Order Status Breakdown
          </button>
        </div>

        {/* Active Report Area */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Chart Block */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Revenue Performance</h2>
                  <p className="text-sm text-slate-500">Daily completed sales volume trends (Last 15 days)</p>
                </div>
              </div>

              {/* Bar Chart Rendering */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex h-64 items-end justify-between gap-2 pt-6 px-4">
                  {data.chart_data?.map((d: any, idx: number) => {
                    const heightPercent = maxRevenue > 0 ? (d.revenue / maxRevenue) * 80 : 0;
                    return (
                      <div key={idx} className="group flex flex-col items-center flex-1">
                        <span className="mb-2 text-[10px] font-semibold text-emerald-800 opacity-0 group-hover:opacity-100 transition duration-200">
                          ₱{d.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div 
                          style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          className={`w-full rounded-t-md bg-gradient-to-t ${
                            d.revenue > 0 
                              ? 'from-emerald-800 to-emerald-600 group-hover:from-emerald-700 group-hover:to-emerald-500 shadow-sm' 
                              : 'from-slate-200 to-slate-100'
                          } transition-all duration-300`}
                          title={`${d.label}: ${formatPHP(d.revenue)}`}
                        />
                        <span className="mt-3 text-[10px] font-medium text-slate-500 truncate max-w-full">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Marketplace Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Transaction Date</th>
                      <th className="pb-3">Total Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_transactions?.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-slate-50 last:border-0 text-sm text-slate-700">
                        <td className="py-4 font-semibold text-slate-900">#ORD-{tx.id}</td>
                        <td className="py-4">{tx.customer_name}</td>
                        <td className="py-4">{tx.date}</td>
                        <td className="py-4 font-semibold text-emerald-800">{formatPHP(tx.total)}</td>
                        <td className="py-4">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : tx.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!data.recent_transactions || data.recent_transactions.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">No transactions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Seller Compliance & Registrations</h2>
            <p className="text-sm text-slate-600 mb-6">Overview of registered farm accounts and their respective business permit verification metrics.</p>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-6">
                <p className="text-sm font-semibold text-emerald-900 uppercase">Verified Accounts</p>
                <p className="mt-4 text-4xl font-bold text-emerald-950">{data.verified_sellers}</p>
                <p className="mt-2 text-xs text-emerald-700">These farm operators have approved LGU business permits and are allowed to publish listings and process orders.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6">
                <p className="text-sm font-semibold text-amber-900 uppercase">Pending Review</p>
                <p className="mt-4 text-4xl font-bold text-amber-950">{data.pending_permits}</p>
                <p className="mt-2 text-xs text-amber-700">These applications need immediate administrative check for business compliance, license issue dates, and file legitimacy.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6">
                <p className="text-sm font-semibold text-slate-500 uppercase">Other Sellers</p>
                <p className="mt-4 text-4xl font-bold text-slate-800">
                  {Math.max(data.total_sellers - data.verified_sellers - data.pending_permits, 0)}
                </p>
                <p className="mt-2 text-xs text-slate-400">Includes sellers with rejected applications or suspended accounts due to permit expirations or code violations.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Order Pipeline Fulfillment</h2>
            <p className="text-sm text-slate-600 mb-6">Status breakdown of all orders placed across the PoultryLink marketplace platform.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">Completed Orders</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.completed || 0}</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">Pending Approvals</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.pending || 0}</p>
                </div>
                <span className="text-2xl">⏳</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">Confirmed & Processing</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {(data.order_stats?.confirmed || 0) + (data.order_stats?.processing || 0)}
                  </p>
                </div>
                <span className="text-2xl">🚜</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">Ready for Delivery</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.ready || 0}</p>
                </div>
                <span className="text-2xl">🛵</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">Cancelled Orders</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">{data.order_stats?.cancelled || 0}</p>
                </div>
                <span className="text-2xl text-red-500">✕</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
