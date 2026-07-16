import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';

interface PermitRequest {
  id: number;
  seller_name: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended';
  documents: string[];
  submitted_at: string;
  notes?: string;
  permit_url?: string | null;
  permit_issue_date?: string | null;
  permit_expiry_date?: string | null;
}

const AdminPermits: React.FC = () => {
  const [permits, setPermits] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<PermitRequest | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'>('all');
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

  const handleUnderReview = async (permitId: number) => {
    try {
      await api.put(`/admin/permits/${permitId}/under-review`);
      setActionMessage('Permit status updated to Under Review');
      fetchPermits();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to set permit under review:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Under Review':
        return 'bg-orange-100 text-orange-800';
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
      case 'Under Review':
        return 'Auditing';
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
    underReview: permits.filter((p) => p.status === 'Under Review').length,
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Pending Approval</p>
                <h2 className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Under Review</p>
                <h2 className="mt-2 text-3xl font-semibold text-orange-600">{stats.underReview}</h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Approved</p>
                <h2 className="mt-2 text-3xl font-semibold text-green-600">{permits.filter((p) => p.status === 'Approved').length}</h2>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Rejected</p>
                <h2 className="mt-2 text-3xl font-semibold text-red-600">{permits.filter((p) => p.status === 'Rejected').length}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'under_review', 'approved', 'rejected', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-emerald-950 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f === 'under_review' ? 'Under Review' : f.charAt(0).toUpperCase() + f.slice(1)}
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
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500 font-semibold flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin"></span>
                Loading permit verification requests...
              </div>
            ) : (
              <>
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
                      
                      {/* Dates Display */}
                      {(permit.permit_issue_date || permit.permit_expiry_date) && (
                        <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          {permit.permit_issue_date && (
                            <p><strong>Date Issued:</strong> {new Date(permit.permit_issue_date).toLocaleDateString()}</p>
                          )}
                          {permit.permit_expiry_date && (
                            <p className="flex items-center gap-1.5">
                              <strong>Expiry Date:</strong> {new Date(permit.permit_expiry_date).toLocaleDateString()}
                              {new Date(permit.permit_expiry_date) < new Date() && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700 font-bold animate-pulse">EXPIRED</span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedPermit(permit);
                          setShowDocumentPreview(true);
                        }}
                        className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        View Full Details & Document Preview →
                      </button>
                    </div>

                    {/* Action Buttons */}
                    {permit.status === 'Pending' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUnderReview(permit.id)}
                          className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                        >
                          👁 Set Under Review
                        </button>
                        <button
                          onClick={() => handleApprove(permit.id)}
                          className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(permit.id)}
                          className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}

                    {permit.status === 'Under Review' && (
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
                        <button
                          onClick={() => handleSuspend(permit.id)}
                          className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          🚫 Suspend Account
                        </button>
                      </div>
                    )}

                    {(permit.status === 'Approved' || permit.status === 'Rejected' || permit.status === 'Suspended') && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {permit.status !== 'Suspended' && (
                          <button
                            onClick={() => handleSuspend(permit.id)}
                            className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            🚫 Suspend Account
                          </button>
                        )}
                        {permit.status === 'Suspended' && (
                          <button
                            onClick={() => handleUnderReview(permit.id)}
                            className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                          >
                            👁 Reset to Under Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {permits.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-sm text-slate-600">No permits found for this filter.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showDocumentPreview && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Verification Document</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedPermit.seller_name}</h3>
                {selectedPermit.permit_issue_date && (
                  <span className="text-xs text-slate-500 block mt-1">
                    <strong>Issued:</strong> {new Date(selectedPermit.permit_issue_date).toLocaleDateString()} 
                    {selectedPermit.permit_expiry_date && (
                      <> | <strong>Expires:</strong> {new Date(selectedPermit.permit_expiry_date).toLocaleDateString()}</>
                    )}
                    {selectedPermit.permit_expiry_date && new Date(selectedPermit.permit_expiry_date) < new Date() && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700 font-bold animate-pulse inline-block">EXPIRED</span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedPermit(null);
                }}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Document Preview */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col items-center justify-center min-h-[400px]">
              {selectedPermit.permit_url ? (
                selectedPermit.permit_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedPermit.permit_url}
                    className="w-full h-[500px] rounded-2xl border border-slate-200"
                    title="Business Permit PDF"
                  />
                ) : (
                  <img
                    src={selectedPermit.permit_url}
                    alt="Business Permit"
                    className="max-h-[500px] max-w-full rounded-2xl object-contain border border-slate-100 shadow-md"
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-slate-500 font-semibold">No document preview available</p>
                  <p className="text-sm text-slate-400 mt-1">Check uploaded document file name: {selectedPermit.documents[0]}</p>
                </div>
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {selectedPermit.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleUnderReview(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      👁 Set Under Review
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                {selectedPermit.status === 'Under Review' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        handleRequestRevision(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      ↻ Request Revision
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedPermit.id);
                        setShowDocumentPreview(false);
                      }}
                      className="rounded-2xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                {(selectedPermit.status === 'Approved' || selectedPermit.status === 'Rejected' || selectedPermit.status === 'Suspended') && (
                  <>
                    {selectedPermit.status !== 'Suspended' && (
                      <button
                        onClick={() => {
                          handleSuspend(selectedPermit.id);
                          setShowDocumentPreview(false);
                        }}
                        className="rounded-2xl border border-slate-300 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        🚫 Suspend Account
                      </button>
                    )}
                    {selectedPermit.status === 'Suspended' && (
                      <button
                        onClick={() => {
                          handleUnderReview(selectedPermit.id);
                          setShowDocumentPreview(false);
                        }}
                        className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        👁 Set Under Review
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedPermit(null);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPermits;
