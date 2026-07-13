import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';

interface PermitRequest {
  id: number;
  seller_name: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  documents: string[];
  submitted_at: string;
  notes?: string;
}

const AdminPermits: React.FC = () => {
  const [permits, setPermits] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<PermitRequest | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchPermits();
  }, [filter]);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/permits', {
        params: { status: filter === 'all' ? undefined : filter },
      });
      setPermits(response.data);
    } catch (error) {
      console.error('Failed to fetch permits:', error);
      // Demo data
      setPermits([
        {
          id: 1,
          seller_name: 'Farm Fresh Poultry Co.',
          status: 'Pending',
          documents: ['Business Permit', 'Tax ID', 'Compliance Declaration'],
          submitted_at: '2 hours ago',
        },
        {
          id: 2,
          seller_name: 'Alpha Poultry Ltd',
          status: 'Pending',
          documents: ['Business Permit', 'KRA Certification'],
          submitted_at: '5 hours ago',
        },
        {
          id: 3,
          seller_name: 'Green Valley Farms',
          status: 'Approved',
          documents: ['Business Permit', 'Health Certificate'],
          submitted_at: '1 day ago',
        },
        {
          id: 4,
          seller_name: 'Quick Poultry Supply',
          status: 'Rejected',
          documents: ['Incomplete Documentation'],
          submitted_at: '3 days ago',
          notes: 'Missing health certificates',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (permitId: number) => {
    try {
      await api.put(`/admin/permits/${permitId}/approve`);
      setActionMessage('Permit approved successfully');
      fetchPermits();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to approve permit:', error);
    }
  };

  const handleReject = async (permitId: number) => {
    try {
      await api.put(`/admin/permits/${permitId}/reject`);
      setActionMessage('Permit rejected successfully');
      fetchPermits();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to reject permit:', error);
    }
  };

  const handleRequestRevision = async (permitId: number) => {
    try {
      await api.put(`/admin/permits/${permitId}/request-revision`);
      setActionMessage('Revision requested from seller');
      fetchPermits();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  const handleSuspend = async (permitId: number) => {
    try {
      await api.put(`/admin/permits/${permitId}/suspend`);
      setActionMessage('Seller account suspended');
      fetchPermits();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to suspend seller:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Suspended':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Top priority';
      case 'Rejected':
        return 'Action needed';
      case 'Suspended':
        return 'Review required';
      default:
        return '';
    }
  };

  const stats = {
    pending: permits.filter((p) => p.status === 'Pending').length,
    underReview: permits.filter((p) => p.status === 'Pending').length,
    documentsMissing: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Permit Verifications</p>
          <h1 className="mt-3 text-3xl font-semibold">Review pending seller permits</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Approve or reject seller permit documents, verify business compliance, and update seller account status with confidence.
          </p>
          <div className="mt-3 rounded-lg bg-emerald-900/50 px-3 py-2 text-xs text-emerald-200 border border-emerald-700">
            <strong>Requirement:</strong> Only business permits are required for seller verification on PoultryLink.
          </div>
        </div>

        {/* Success Message */}
        {actionMessage && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">{actionMessage}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Pending Approval</p>
                <h2 className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</h2>
              </div>
              <span className="rounded-2xl bg-amber-100 px-3 py-2 text-sm text-amber-700 font-semibold">Top priority</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Approved</p>
                <h2 className="mt-2 text-3xl font-semibold text-green-600">{permits.filter((p) => p.status === 'Approved').length}</h2>
              </div>
              <span className="rounded-2xl bg-green-100 px-3 py-2 text-sm text-green-700 font-semibold">Verified</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Rejected</p>
                <h2 className="mt-2 text-3xl font-semibold text-red-600">{permits.filter((p) => p.status === 'Rejected').length}</h2>
              </div>
              <span className="rounded-2xl bg-red-100 px-3 py-2 text-sm text-red-700 font-semibold">Review</span>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-emerald-950 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Permits List */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Seller permit queue</p>
              <h2 className="text-2xl font-semibold text-slate-900">Manage permits</h2>
            </div>
            <button
              onClick={() => fetchPermits()}
              className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Refresh queue
            </button>
          </div>

          <div className="space-y-4">
            {permits.map((permit) => (
              <div key={permit.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:shadow-md transition">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-500">Seller Account</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">{permit.seller_name}</h3>
                    <p className="mt-2 text-sm text-slate-600">Submitted {permit.submitted_at}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-2xl px-3 py-1 text-sm font-semibold ${getStatusColor(permit.status)}`}>
                      {permit.status}
                    </span>
                    {getStatusPriority(permit.status) && (
                      <span className="rounded-2xl bg-slate-100 px-3 py-1 text-sm text-slate-600">
                        {getStatusPriority(permit.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="mb-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Documents Submitted</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {permit.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
                        📄 {doc}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPermit(permit);
                      setShowDocumentPreview(true);
                    }}
                    className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View Full Details →
                  </button>
                </div>

                {/* Action Buttons */}
                {permit.status === 'Pending' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(permit.id)}
                      className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleRequestRevision(permit.id)}
                      className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      ↻ Request Revision
                    </button>
                    <button
                      onClick={() => handleReject(permit.id)}
                      className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {(permit.status === 'Approved' || permit.status === 'Rejected') && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleSuspend(permit.id)}
                      className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      🚫 Suspend Account
                    </button>
                  </div>
                )}
              </div>
            ))}

            {permits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">No permits found for this filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPermits;
