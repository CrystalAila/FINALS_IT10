import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  ArrowRight,
  FileText,
  Truck,
  Store,
  User,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const AccountStatus: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const role = user.role;
  const isRider = role === 'rider';
  const isSeller = role === 'seller' || role === 'reseller';

  // Determine normalized status
  const rawStatus = (user.status || 'pending').toLowerCase();
  const isApproved = rawStatus === 'verified' || rawStatus === 'approved' || rawStatus === 'active';
  const isRejected = rawStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  // Rejection reasons
  const rejectionReason =
    user.rider?.rejection_reason ||
    (user.farm as any)?.rejection_reason ||
    (isRejected
      ? 'Your submitted verification documents or details did not meet our verification standards. Please review your information and upload clear, valid documentation.'
      : null);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setFeedbackMessage(null);
    try {
      const res = await api.get('/user');
      const freshUser = res.data?.user;
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('poultry_user', JSON.stringify(freshUser));

        const freshStatus = (freshUser.status || '').toLowerCase();
        if (freshStatus === 'verified' || freshStatus === 'approved' || freshStatus === 'active') {
          setFeedbackMessage('Congratulations! Your application has been approved.');
          setTimeout(() => {
            if (freshUser.role === 'rider') {
              navigate('/rider/dashboard', { replace: true });
            } else if (freshUser.role === 'seller' || freshUser.role === 'reseller') {
              navigate('/seller/dashboard', { replace: true });
            }
          }, 1500);
        } else if (freshStatus === 'rejected') {
          setFeedbackMessage('Status updated: Your application has been rejected. Please review admin feedback below.');
        } else {
          setFeedbackMessage('Status refreshed: Your application is still currently under review.');
        }
      }
    } catch (err: any) {
      setFeedbackMessage(err?.response?.data?.message || 'Could not refresh status right now. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (isRider) {
      navigate('/rider/login', { replace: true });
    } else if (isSeller) {
      navigate('/seller-login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="PoultryLink" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Poultry<span className="text-[#D96B27]">Link</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">
              {isRider ? 'Delivery Partner' : isSeller ? 'Seller Partner' : user.role} Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800">{user.fullname}</p>
              <p className="text-[11px] text-slate-500">{user.email || user.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Flash Feedback */}
        {feedbackMessage && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Status Card */}
        {isPending && (
          <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-card">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
                  <Clock className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                    Application Status: Pending Review
                  </div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Application Under Review</h1>
                  <p className="mt-1 text-sm text-amber-100">
                    Thank you for applying to be a {isRider ? 'delivery rider' : 'poultry seller'} on PoultryLink! Your credentials have been submitted and are awaiting administrator verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 space-y-3">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  What happens next?
                </h3>
                <ul className="text-xs text-amber-800 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Document Verification:</strong> Platform administrators review your submitted {isRider ? "2x2 ID photo and valid Driver's License" : "business permit and farm location"} to guarantee safety and compliance.
                  </li>
                  <li>
                    <strong>Review Timeframe:</strong> Applications are typically verified within <strong>24 to 48 hours</strong> during business days.
                  </li>
                  <li>
                    <strong>Instant Access:</strong> As soon as an administrator verifies your application, this page will automatically unlock your full operational dashboard.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking Status...' : 'Check Status Now'}
                </button>

                {isRider && (
                  <Link
                    to="/rider/application"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <FileText className="h-4 w-4 text-slate-400" />
                    Review / Edit Details
                  </Link>
                )}

                {isSeller && (
                  <Link
                    to="/seller/shop"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <Store className="h-4 w-4 text-slate-400" />
                    Review Shop & Permit
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejected State */}
        {isRejected && (
          <div className="overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-card">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                    Application Status: Needs Revision
                  </div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Application Not Approved</h1>
                  <p className="mt-1 text-sm text-rose-100">
                    An administrator inspected your {isRider ? 'rider application' : 'seller permit'} and was unable to approve it. Please review the feedback below and resubmit.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {rejectionReason && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Administrator Remarks / Feedback:
                  </p>
                  <p className="text-sm text-rose-800 leading-relaxed font-medium">
                    "{rejectionReason}"
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                You can easily update your information or upload clearer, valid document files using the button below. Once resubmitted, our team will review your application again.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {isRider && (
                  <Link
                    to="/rider/application"
                    state={{ rejected: true, message: rejectionReason }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition"
                  >
                    <span>Update Details & Resubmit Documents</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                {isSeller && (
                  <Link
                    to="/seller/shop"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition"
                  >
                    <span>Re-upload Business Permit</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approved State */}
        {isApproved && (
          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-card">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                    Application Status: Verified
                  </div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Your Account is Approved!</h1>
                  <p className="mt-1 text-sm text-emerald-100">
                    Your credentials have been fully verified by PoultryLink administrators. You are now authorized to operate on the platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                Welcome to the PoultryLink partner network! You now have full access to claim orders, manage your profile, and start earning.
              </p>

              <div className="pt-2">
                <Link
                  to={isRider ? '/rider/dashboard' : '/seller/dashboard'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition"
                >
                  <span>Proceed to {isRider ? 'Rider Dashboard' : 'Seller Dashboard'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-[#D96B27]" />
            Submitted Application Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Applicant Name
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                {user.fullname}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Account Role & Status
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 capitalize">{user.role}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {user.status || 'Pending'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {user.phone || 'Not provided'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <p className="font-semibold text-slate-800 truncate">
                {user.email || 'None (username login)'}
              </p>
            </div>

            {isRider && user.rider && (
              <>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Vehicle Type & Plate
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-slate-400" />
                    {user.rider.vehicle_type || 'Motorcycle'} — {user.rider.plate_number || 'N/A'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Delivery Base Address
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{user.rider.address || 'Address provided'}</span>
                  </p>
                </div>
              </>
            )}

            {isSeller && user.farm && (
              <>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Farm / Shop Name
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Store className="h-4 w-4 text-slate-400" />
                    {user.farm.name || user.business_name || 'Farm Shop'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Farm Location
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{user.farm.location || user.farm.full_address || 'Roxas City, Capiz'}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4">
          <p>
            PoultryLink Partner Verification Portal &bull; Need help? Contact our administrative desk at{' '}
            <span className="font-semibold text-slate-700">support@poultrylink.com</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AccountStatus;

