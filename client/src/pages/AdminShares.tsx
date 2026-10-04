import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import SearchIcon from '../components/common/SearchIcon';
import PrintIcon from '../components/common/PrintIcon';
import { useToast } from '../context/ToastContext';

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
  const { toast } = useToast();
  const [shares, setShares] = useState<AdminShareItem[]>([]);
  const [summary, setSummary] = useState<ShareSummary | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [search, setSearch] = useState('');
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
      toast.error('Failed to load shares. Please try again.');
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
      toast.success('Successfully synchronized shares from seller orders!');
      fetchShares();
    } catch (err) {
      console.error('Failed to sync shares:', err);
      toast.error('Error syncing shares. Please try again.');
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
      toast.success(res.data.message || 'Payment recorded successfully.');
      setPayingShare(null);
      setPaymentRef('');
      setPaymentNotes('');
      fetchShares();
    } catch (err: any) {
      console.error('Failed to mark share as paid:', err);
      toast.error(err?.response?.data?.message || 'Failed to record payment.');
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
      {/* SCREEN VIEW */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <div>
            <h1 className="text-2xl font-bold">Admin Shares</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition backdrop-blur-sm cursor-pointer"
            >
              <PrintIcon className="h-4 w-4" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="print:hidden inline-flex items-center gap-2 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {syncing ? 'Syncing...' : 'Sync Shares Now'}
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected (This Month)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatPHP(summary.total_collected_month)}</p>
              <p className="mt-1 text-xs text-slate-500">Paid 5% platform fees for {formatMonth(summary.current_month)}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Due (This Month)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatPHP(summary.total_due_month)}</p>
              <p className="mt-1 text-xs text-slate-500">Awaiting payment before grace period deadline</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue (Auto-Suspended)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatPHP(summary.total_overdue_amount)}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">{summary.overdue_count} {summary.overdue_count === 1 ? 'share overdue' : 'shares overdue'}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unpaid Sellers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.unpaid_sellers_count}</p>
              <p className="mt-1 text-xs text-slate-500">Sellers with outstanding platform shares</p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 print:hidden">
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
                <option value="all">All Periods</option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {formatMonth(p)}
                  </option>
                ))}
              </select>

              <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-[220px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search seller or farm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Shares Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Platform Share Records</h2>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredShares.length} {filteredShares.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Seller & Farm</th>
                  <th className="py-3.5 px-4">Billing Period</th>
                  <th className="py-3.5 px-4">Total Revenue</th>
                  <th className="py-3.5 px-4">5% Share</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <span className="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></span>
                      Loading administrative shares...
                    </td>
                  </tr>
                ) : filteredShares.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      No administrative shares found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredShares.map((share) => {
                    const isOverdue = share.status === 'overdue';
                    const isPaid = share.status === 'paid';
                    return (
                      <tr key={share.id} className="hover:bg-slate-50/50 transition">
                        {/* Seller & Farm */}
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-900">
                            {share.seller?.fullname || share.seller?.username || 'Unknown Seller'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {share.farm?.name || 'No farm listed'}
                            {share.seller?.phone ? ` • ${share.seller.phone}` : ''}
                          </p>
                        </td>

                        {/* Billing Period */}
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {formatMonth(share.billing_period)}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {formatPHP(share.total_revenue)}
                        </td>

                        {/* Share Amount */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {formatPHP(share.share_amount)}
                        </td>

                        {/* Due Date & Grace */}
                        <td className="py-4 px-4 text-xs">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                            {share.due_date ? new Date(share.due_date).toLocaleDateString() : 'N/A'}
                          </span>
                          {share.status !== 'paid' && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Grace: {new Date(share.grace_period_date).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800" title="Shop is automatically suspended">
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Unpaid
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right">
                          {isPaid ? (
                            <span className="text-xs text-slate-400 italic">
                              {share.paid_at ? new Date(share.paid_at).toLocaleDateString() : 'Completed'}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPayingShare(share);
                                setPaymentRef(share.payment_reference || '');
                                setPaymentNotes(share.notes || '');
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mark as Paid Modal */}
        {payingShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Record Platform Share Payment</h3>
                <button
                  onClick={() => setPayingShare(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-900 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Details</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {payingShare.seller?.fullname || payingShare.seller?.username}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Period: {formatMonth(payingShare.billing_period)} • Gross Sales: {formatPHP(payingShare.total_revenue)}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
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

      {/* FORMAL PRINT REPORT LAYOUT (PLAIN WHITE, FORMAL HEADERS, NO COLOR CARDS) */}
      <div className="hidden print:block text-slate-900 bg-white font-sans text-xs p-2">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">PoultryLink Agricultural Marketplace</p>
              <h1 className="text-xl font-bold uppercase text-slate-950 mt-0.5">
                Administrative Shares (5% Platform Fee) Statement & Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Financial Operations & Seller Revenue Settlements &bull; Billing Period: {selectedPeriod === 'all' ? 'All Recorded Periods' : formatMonth(selectedPeriod)}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900">
                Official Financial Statement
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
        {summary && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
              I. Platform Shares Collection Summary
            </h2>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Total Collected (This Month)</td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 w-1/4 text-sm">{formatPHP(summary.total_collected_month)}</td>
                  <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300 w-1/4">Total Due (This Month)</td>
                  <td className="p-2.5 font-bold text-slate-900 w-1/4 text-sm">{formatPHP(summary.total_due_month)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Total Overdue Amount</td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                    {formatPHP(summary.total_overdue_amount)} ({summary.overdue_count} overdue)
                  </td>
                  <td className="p-2.5 font-semibold bg-slate-50 border-r border-slate-300">Unpaid Sellers Count</td>
                  <td className="p-2.5 font-bold text-slate-900">{summary.unpaid_sellers_count}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Section 2: Itemized Schedule */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            II. Itemized Platform Share Billing Schedule
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold">Seller & Farm Name</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Billing Period</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">Seller Gross Sales</th>
                <th className="p-2 border border-slate-400 text-right font-semibold">5% Share Due</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Due Date</th>
                <th className="p-2 border border-slate-400 text-center font-semibold">Status</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Payment Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredShares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-3 text-center text-slate-500 border border-slate-300">
                    No share records matching current selection.
                  </td>
                </tr>
              ) : (
                filteredShares.map((share) => (
                  <tr key={share.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-semibold">
                      {share.seller?.fullname || share.seller?.username}
                      {share.farm?.name ? <span className="block text-[10px] font-normal text-slate-600">{share.farm.name}</span> : null}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">{formatMonth(share.billing_period)}</td>
                    <td className="p-2 border border-slate-300 text-right">{formatPHP(share.total_revenue)}</td>
                    <td className="p-2 border border-slate-300 text-right font-bold">{formatPHP(share.share_amount)}</td>
                    <td className="p-2 border border-slate-300 text-center">{share.due_date ? new Date(share.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-2 border border-slate-300 text-center uppercase font-bold text-[10px]">{share.status}</td>
                    <td className="p-2 border border-slate-300 text-[10px]">{share.payment_reference || share.notes || (share.status === 'paid' ? 'Settled' : 'Pending')}</td>
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
            <p className="mt-1">Financial Officer / Administrator</p>
          </div>
          <div>
            <p className="font-semibold">Approved / Verified By:</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1">Operations & Compliance Head</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShares;
