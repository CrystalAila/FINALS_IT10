import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';
import SearchIcon from '../components/common/SearchIcon';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  UserCheck,
  Truck,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';
import PermitDocumentViewer from '../components/common/PermitDocumentViewer';

interface RiderApplication {
  id: number;
  user_id: number | null;
  username: string | null;
  fullname: string;
  phone: string;
  address: string | null;
  photo_path: string | null;
  photo_url: string;
  license_photo_path: string | null;
  license_photo_url: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at: string | null;
}

interface ApplicationCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

const AdminRiders: React.FC = () => {
  const toast = useToast();
  const [applications, setApplications] = useState<RiderApplication[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal inspection state
  const [inspectRider, setInspectRider] = useState<RiderApplication | null>(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState<'photo' | 'license'>('photo');
  const [showDocZoomViewer, setShowDocZoomViewer] = useState<boolean>(false);

  // Action states
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/rider-applications', {
        params: { status: filter === 'all' ? undefined : filter },
      });
      setApplications(res.data.applications || []);
      if (res.data.counts) {
        setCounts(res.data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch rider applications:', error);
      toast.error('Failed to load rider applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to approve rider application for "${name}"?`)) {
      return;
    }
    setProcessingId(id);
    try {
      await api.put(`/admin/rider-applications/${id}/approve`);
      toast.success(`Rider ${name} has been approved successfully!`);
      if (inspectRider && inspectRider.id === id) {
        setInspectRider((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
      fetchApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve rider application.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number, name: string) => {
    const reason = window.prompt(
      `Are you sure you want to reject the rider application for "${name}"?\n\nEnter reason for rejection (optional, will be shown to the rider so they can correct it):`,
      'Photo of Driver\'s License or 2x2 photo is unclear/incomplete. Please re-upload clearer photos.'
    );
    if (reason === null) {
      return;
    }
    setProcessingId(id);
    try {
      await api.put(`/admin/rider-applications/${id}/reject`, { reason });
      toast.warning(`Rider application for ${name} has been rejected.`);
      if (inspectRider && inspectRider.id === id) {
        setInspectRider((prev) => (prev ? { ...prev, status: 'rejected', rejection_reason: reason } : null));
      }
      fetchApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject rider application.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.fullname.toLowerCase().includes(term) ||
      (app.username && app.username.toLowerCase().includes(term)) ||
      app.phone.toLowerCase().includes(term) ||
      (app.address && app.address.toLowerCase().includes(term)) ||
      (app.vehicle_type && app.vehicle_type.toLowerCase().includes(term)) ||
      (app.plate_number && app.plate_number.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            Pending Approval
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title & Summary */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Rider Verification & Approvals
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review 2x2 photos and Driver's Licenses for independent delivery riders. Only approved riders can log in and claim orders.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applicants</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{counts.all}</p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{counts.pending}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved Riders</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{counts.approved}</p>
          </div>
          <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">{counts.rejected}</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold capitalize transition cursor-pointer ${
                  filter === tab
                    ? 'bg-[#D96B27] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Applicants' : tab}
                <span className="ml-1.5 opacity-80">
                  ({counts[tab]})
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[260px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Loading rider applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <Truck className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No rider applications found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? 'No applications match your search query.' : 'There are currently no rider registration applications.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredApplications.map((rider) => (
              <div
                key={rider.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  {/* Top: 2x2 Photo + Info Header */}
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => {
                        setInspectRider(rider);
                        setActivePreviewDoc('photo');
                      }}
                      className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-100 shadow-sm shrink-0"
                      title="Click to zoom 2x2 photo"
                    >
                      <img
                        src={rider.photo_url}
                        alt={rider.fullname}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white uppercase">
                        2x2
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 truncate" title={rider.fullname}>
                            {rider.fullname}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">@{rider.username || `rider_${rider.id}`}</p>
                        </div>
                      </div>
                      <div className="mt-2">{getStatusBadge(rider.status)}</div>
                    </div>
                  </div>

                  {/* Rider Details Details */}
                  <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{rider.phone}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{rider.address || 'Address not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Vehicle: <strong className="text-slate-800">{rider.vehicle_type || 'N/A'}</strong>
                        {rider.plate_number && (
                          <span className="ml-1 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {rider.plate_number}
                          </span>
                        )}
                      </span>
                    </div>

                    {rider.created_at && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Submitted on {new Date(rider.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Documents Section Button */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectRider(rider);
                        setActivePreviewDoc('license');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 py-2.5 px-3 text-xs font-semibold transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Driver's License
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectRider(rider);
                        setActivePreviewDoc('photo');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 text-xs font-semibold transition cursor-pointer"
                    >
                      Inspect All
                    </button>
                  </div>
                </div>

                {/* Bottom Actions: Approve / Reject */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                  {rider.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={processingId === rider.id}
                      onClick={() => handleApprove(rider.id, rider.fullname)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}

                  {rider.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={processingId === rider.id}
                      onClick={() => handleReject(rider.id, rider.fullname)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 px-4 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}

                  {rider.status === 'approved' && (
                    <div className="w-full text-center text-xs text-emerald-700 font-semibold py-1">
                      ✓ Approved & Active on Platform
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Document & Photo Inspection Modal */}
      {inspectRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-brand flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  <img src={inspectRider.photo_url} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{inspectRider.fullname}</h3>
                  <p className="text-xs text-slate-500">
                    Rider Application Review • Status: <span className="font-semibold capitalize text-slate-800">{inspectRider.status}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectRider(null)}
                className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inspectRider.status === 'rejected' && (
              <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  Application Rejected
                </p>
                {inspectRider.rejection_reason && (
                  <p className="mt-1 text-slate-700">
                    <span className="font-semibold text-rose-700">Reason:</span> {inspectRider.rejection_reason}
                  </p>
                )}
                <p className="mt-1 text-slate-500 text-[11px]">
                  The rider can log in to update their details, re-upload documents, and resubmit for review.
                </p>
              </div>
            )}

            {/* Document Switcher Tabs */}
            <div className="mt-4 flex gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setActivePreviewDoc('photo')}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  activePreviewDoc === 'photo'
                    ? 'bg-[#D96B27] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2x2 Profile Photo
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewDoc('license')}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  activePreviewDoc === 'license'
                    ? 'bg-[#D96B27] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Driver's License Photo
              </button>
            </div>

            {/* Modal Body: Document Preview & Info */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/5 p-4 border border-slate-200 min-h-[280px]">
                {activePreviewDoc === 'photo' ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={inspectRider.photo_url}
                      alt="2x2 ID Photo"
                      className="max-h-[360px] max-w-full rounded-2xl object-contain shadow-lg border-2 border-white"
                    />
                    <p className="mt-3 text-xs font-semibold text-slate-600">Official 2x2 Profile Photo</p>
                  </div>
                ) : inspectRider.license_photo_url ? (
                  <div className="flex flex-col items-center w-full">
                    <img
                      src={inspectRider.license_photo_url}
                      alt="Driver's License Document"
                      className="max-h-[380px] max-w-full rounded-2xl object-contain shadow-lg border-2 border-white"
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDocZoomViewer(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#C55A1A] transition cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        Inspect & Zoom License
                      </button>
                      <a
                        href={inspectRider.license_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open original
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">No Driver's License file uploaded for this rider.</p>
                  </div>
                )}
              </div>

              {/* Applicant Summary Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Phone</p>
                  <p className="font-bold text-slate-800 mt-0.5">{inspectRider.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Vehicle</p>
                  <p className="font-bold text-slate-800 mt-0.5">{inspectRider.vehicle_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Plate #</p>
                  <p className="font-bold text-slate-800 mt-0.5">{inspectRider.plate_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Base Address</p>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{inspectRider.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer: Quick Actions */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectRider(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {inspectRider.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={processingId === inspectRider.id}
                    onClick={() => handleReject(inspectRider.id, inspectRider.fullname)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                )}

                {inspectRider.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={processingId === inspectRider.id}
                    onClick={() => handleApprove(inspectRider.id, inspectRider.fullname)}
                    className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                  >
                    Approve Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Zoom & Pan Viewer for Rider License / Photo */}
      {inspectRider && (
        <PermitDocumentViewer
          open={showDocZoomViewer}
          onClose={() => setShowDocZoomViewer(false)}
          documentUrl={activePreviewDoc === 'license' ? inspectRider.license_photo_url : inspectRider.photo_url}
          title={inspectRider.fullname}
          subtitle={`Rider Application • ${activePreviewDoc === 'license' ? "Driver's License Photo" : '2x2 Profile Photo'}`}
          allowDateEditing={false}
        />
      )}
    </AdminLayout>
  );
};

export default AdminRiders;
