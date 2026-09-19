import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import SearchIcon from '../components/common/SearchIcon';

interface SellerUser {
  id: number;
  fullname: string;
  username: string;
  phone?: string;
  email?: string;
  status: string;
}

interface SellerFarm {
  id: number;
  name: string;
  location?: string;
  permit_status: string;
}

interface AdminShareItem {
  id: number;
  seller_id: number;
  farm_id: number | null;
  billing_period: string;
  period_start: string;
  period_end: string;
  total_revenue: number | string;
  share_percentage: number | string;
  share_amount: number | string;
  due_date: string;
  grace_period_date: string;
  status: 'unpaid' | 'paid' | 'overdue';
  paid_at?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  seller?: SellerUser;
  farm?: SellerFarm;
}

interface ShareSummary {
  current_month: string;
  total_collected_month: number;
  total_due_month: number;
  total_overdue_amount: number;
  overdue_count: number;
  unpaid_sellers_count: number;
}

const AdminShares: React.FC = () => {
  const [shares, setShares] = useState<AdminShareItem[]>([]);
  const [summary, setSummary] = useState<ShareSummary | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Modal for Mark as Paid
  const [payingShare, setPayingShare] = useState<AdminShareItem | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchShares();
  }, [filter, selectedPeriod]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      if (selectedPeriod !== 'all') params.period = selectedPeriod;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/shares', { params });
      setShares(res.data.shares || []);
      setSummary(res.data.summary || null);
      setAvailablePeriods(res.data.available_periods || []);
    } catch (err) {
      console.error('Failed to load admin shares:', err);
      setActionMessage('Failed to load shares. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShares();
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/admin/shares/sync');
      setActionMessage('Successfully synchronized shares from seller orders!');
      fetchShares();
    } catch (err) {
      console.error('Failed to sync shares:', err);
      setActionMessage('Error syncing shares. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!payingShare) return;
    try {
      setSubmittingPayment(true);
      const res = await api.put(`/admin/shares/${payingShare.id}/mark-paid`, {
        reference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      setActionMessage(res.data.message || 'Payment recorded successfully.');
      setPayingShare(null);
      setPaymentRef('');
      setPaymentNotes('');
      fetchShares();
    } catch (err: any) {
      console.error('Failed to mark share as paid:', err);
      alert(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatPHP = (val: number | string) => {
    return '₱' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatMonth = (periodStr: string) => {
    if (!periodStr) return '';
    try {
      const date = new Date(periodStr + '-01T00:00:00');
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return periodStr;
    }
  };

  const filteredShares = shares.filter((share) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const sellerMatch = share.seller?.fullname?.toLowerCase().includes(term) || share.seller?.username?.toLowerCase().includes(term);
    const farmMatch = share.farm?.name?.toLowerCase().includes(term);
    const periodMatch = share.billing_period?.toLowerCase().includes(term);
    return Boolean(sellerMatch || farmMatch || periodMatch);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100 font-semibold">Revenue Compliance</p>
            <h1 className="mt-2 text-3xl font-semibold">Admin Share Management</h1>
          </div>
          <div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Shares Now'}
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-900 flex items-center justify-between shadow-sm">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top KPI Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected (This Month)</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{formatPHP(summary.total_collected_month)}</p>
              <p className="mt-1 text-xs text-slate-500">Paid 5% platform fees for {formatMonth(summary.current_month)}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Due (This Month)</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{formatPHP(summary.total_due_month)}</p>
              <p className="mt-1 text-xs text-slate-500">Awaiting payment before grace period deadline</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue (Auto-Suspended)</p>
              <p className="mt-2 text-3xl font-bold text-rose-600">{formatPHP(summary.total_overdue_amount)}</p>
              <p className="mt-1 text-xs text-rose-500 font-medium">{summary.overdue_count} {summary.overdue_count === 1 ? 'share overdue' : 'shares overdue'}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unpaid Sellers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.unpaid_sellers_count}</p>
              <p className="mt-1 text-xs text-slate-500">Sellers with outstanding platform shares</p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'unpaid', 'overdue', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                    filter === s
                      ? 'bg-emerald-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All Shares' : s}
                </button>
              ))}
            </div>

            {/* Period selector & Search form */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"
              >
                <option value="all">All Months</option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {formatMonth(p)} ({p})
                  </option>
                ))}
              </select>

              <div className="relative flex items-center min-w-[220px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search seller or farm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Shares Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent mr-2 align-middle"></span>
              Loading platform shares...
            </div>
          ) : filteredShares.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No platform share records found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <th className="pb-4">Seller & Farm</th>
                    <th className="pb-4">Billing Month</th>
                    <th className="pb-4 text-right">Gross Sales</th>
                    <th className="pb-4 text-right">5% Admin Share</th>
                    <th className="pb-4">Due Date</th>
                    <th className="pb-4">Auto-Suspension Deadline</th>
                    <th className="pb-4 text-center">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredShares.map((share) => {
                    const isOverdue = share.status === 'overdue';
                    const isPaid = share.status === 'paid';

                    return (
                      <tr key={share.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 font-semibold text-slate-900">
                          <div>
                            <p>{share.seller?.fullname || share.seller?.username || 'Unknown Seller'}</p>
                            <p className="text-xs text-slate-500 font-normal">
                              Farm: {share.farm?.name || 'N/A'} {share.seller?.phone && `• ${share.seller.phone}`}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 text-slate-700 font-medium">
                          {formatMonth(share.billing_period)}
                        </td>
                        <td className="py-4 text-right font-medium text-slate-700">
                          {formatPHP(share.total_revenue)}
                        </td>
                        <td className="py-4 text-right font-bold text-slate-900">
                          {formatPHP(share.share_amount)}
                        </td>
                        <td className="py-4 text-slate-600 text-xs font-medium">
                          {new Date(share.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 text-xs">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                            {new Date(share.grace_period_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800" title="Shop is automatically suspended">
                              Overdue (Suspended)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isPaid ? (
                            <span className="text-xs text-slate-400 italic">
                              Paid {share.paid_at ? new Date(share.paid_at).toLocaleDateString() : ''}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPayingShare(share);
                                setPaymentRef('');
                                setPaymentNotes('');
                              }}
                              className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Mark Share as Paid */}
        {payingShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Mark Share as Paid</h3>
                <button
                  onClick={() => setPayingShare(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-950 border border-emerald-200/60">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Payment Details</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {payingShare.seller?.fullname || payingShare.seller?.username}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Period: {formatMonth(payingShare.billing_period)} • Gross Sales: {formatPHP(payingShare.total_revenue)}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                    {formatPHP(payingShare.share_amount)}
                  </p>
                </div>

                {payingShare.status === 'overdue' && (
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-900 text-xs border border-amber-200">
                    <strong>Shop Reinstatement Notice:</strong> Marking this overdue share as paid will automatically unsuspend this seller's shop and restore listings to active.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GCash Ref #1234567, Cash receipt, Bank ref"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add internal notes regarding this transaction..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingShare(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submittingPayment}
                  className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingPayment ? 'Saving...' : 'Confirm Paid'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminShares;
