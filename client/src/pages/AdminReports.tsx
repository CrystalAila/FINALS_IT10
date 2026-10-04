import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import PrintIcon from '../components/common/PrintIcon';

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
    return '₱' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const maxRevenue = Math.max(...(data.chart_data?.map((d: any) => Number(d.revenue) || 0) || [0]), 1);

  return (
    <AdminLayout>
      {/* SCREEN VIEW */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition backdrop-blur-sm cursor-pointer self-start sm:self-auto"
          >
            <PrintIcon className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {data.total_sellers > 0 ? Math.round((data.verified_sellers / data.total_sellers) * 100) : 0}% approval rate
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase font-semibold text-slate-500">Pending Permits</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{data.pending_permits}</p>
            <p className="mt-1 text-xs text-slate-400">Awaiting compliance review</p>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="flex gap-2 flex-wrap print:hidden">
          <button
            onClick={() => setActiveTab('sales')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'sales'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sales Volume & Charts
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'verification'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Seller & Permit Verification
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
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
                        <span className="mb-2 text-[10px] font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition duration-200">
                          ₱{Number(d.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                        <td className="py-4 font-semibold text-slate-900">{formatPHP(tx.total)}</td>
                        <td className="py-4">
                          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
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
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-600 uppercase">Verified Accounts</p>
                <p className="mt-4 text-4xl font-bold text-slate-900">{data.verified_sellers}</p>
                <p className="mt-2 text-xs text-slate-500">These farm operators have approved LGU business permits and are allowed to publish listings and process orders.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-600 uppercase">Pending Review</p>
                <p className="mt-4 text-4xl font-bold text-slate-900">{data.pending_permits}</p>
                <p className="mt-2 text-xs text-slate-500">These applications need immediate administrative check for business compliance, license issue dates, and file legitimacy.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-600 uppercase">Other Sellers</p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {Math.max(data.total_sellers - data.verified_sellers - data.pending_permits, 0)}
                </p>
                <p className="mt-2 text-xs text-slate-500">Includes sellers with rejected applications or suspended accounts due to permit expirations or code violations.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Order Pipeline Fulfillment</h2>
            <p className="text-sm text-slate-600 mb-6">Status breakdown of all orders placed across the PoultryLink marketplace platform.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Completed Orders</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.completed || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Pending Approvals</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.pending || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Confirmed & Processing</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {(data.order_stats?.confirmed || 0) + (data.order_stats?.processing || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Ready for Delivery</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.ready || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Cancelled Orders</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.order_stats?.cancelled || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FORMAL PRINT REPORT LAYOUT (PLAIN WHITE, FORMAL HEADERS, NO COLOR CARDS) */}
      <div className="hidden print:block text-slate-900 bg-white font-sans text-xs p-2">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">PoultryLink Agricultural Marketplace</p>
              <h1 className="text-xl font-bold uppercase text-slate-950 mt-0.5">
                Marketplace Operations & Analytics Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                System Administration & Compliance Division &bull; PoultryLink Platform
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900">
                Official Admin Report
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
            I. Platform Key Summary Metrics
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Total Orders Processed</td>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 w-1/4 text-sm">{data.total_orders}</td>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Registered Sellers</td>
                <td className="p-2.5 font-bold text-slate-900 w-1/4 text-sm">{data.total_sellers}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Verified & Compliant Sellers</td>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                  {data.verified_sellers} ({data.total_sellers > 0 ? Math.round((data.verified_sellers / data.total_sellers) * 100) : 0}%)
                </td>
                <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Pending Business Permits</td>
                <td className="p-2.5 font-bold text-slate-900">{data.pending_permits}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Order Fulfillment Pipeline */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            II. Order Pipeline Fulfillment Breakdown
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold">Order Fulfillment Status</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Volume Count</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Percentage Share</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Completed Orders', count: data.order_stats?.completed || 0 },
                { label: 'Pending Approvals', count: data.order_stats?.pending || 0 },
                { label: 'Confirmed & In Processing', count: (data.order_stats?.confirmed || 0) + (data.order_stats?.processing || 0) },
                { label: 'Ready for Delivery', count: data.order_stats?.ready || 0 },
                { label: 'Cancelled / Rejected Orders', count: data.order_stats?.cancelled || 0 },
              ].map((item, i) => {
                const total = data.total_orders || 1;
                const pct = ((item.count / total) * 100).toFixed(1);
                return (
                  <tr key={i} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-medium">{item.label}</td>
                    <td className="p-2 border border-slate-300 text-right font-bold">{item.count}</td>
                    <td className="p-2 border border-slate-300 text-right">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 3: Recent Transactions */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            III. Recent Marketplace Transactions
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold">Order ID</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Customer</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Date</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Total Amount</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(!data.recent_transactions || data.recent_transactions.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-500 border border-slate-300">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                data.recent_transactions.slice(0, 15).map((tx: any) => (
                  <tr key={tx.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-semibold">#ORD-{tx.id}</td>
                    <td className="p-2 border border-slate-300">{tx.customer_name}</td>
                    <td className="p-2 border border-slate-300">{tx.date}</td>
                    <td className="p-2 border border-slate-300 text-right font-bold">{formatPHP(tx.total)}</td>
                    <td className="p-2 border border-slate-300 text-center uppercase text-[10px] font-semibold">{tx.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Line */}
        <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-700">
          <div>
            <p className="font-semibold">Prepared By:</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1">System Administrator</p>
          </div>
          <div>
            <p className="font-semibold">Noted By / Verified By:</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1">Authorized Operations Head</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
