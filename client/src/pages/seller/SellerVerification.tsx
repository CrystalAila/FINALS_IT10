import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';

const SellerVerification: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [farm, setFarm] = useState<any>(null);

  const loadFarm = async () => {
    try {
      const res = await api.get('/seller/farm');
      setFarm(res.data.farm);
    } catch (err) {
      console.error('Failed to load farm details:', err);
    }
  };

  useEffect(() => {
    loadFarm();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const res = await api.get('/user');
      setUser(res.data.user);
      await loadFarm();
      if (res.data.user.status === 'verified') {
        navigate('/seller/dashboard');
      } else {
        setMessage('Status re-fetched: your account is still ' + res.data.user.status);
      }
    } catch (err) {
      console.error('Failed to sync profile', err);
      setMessage('Could not sync status. Please try again.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/seller-login');
  };

  if (!user) return null;

  const renderStatusDetails = () => {
    switch (user.status) {
      case 'pending':
        return {
          icon: <Clock className="h-16 w-16 text-amber-500 animate-pulse" />,
          title: 'Verification Pending',
          bgClass: 'from-amber-50 to-orange-50 border-amber-200',
          textColor: 'text-amber-800',
          desc: 'Your business details and permit are currently pending review. Our administrative team will verify your documents shortly. Usually, this process takes 1-2 business days.',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'under_review':
        return {
          icon: <Clock className="h-16 w-16 text-orange-500 animate-pulse" />,
          title: 'Application Under Review',
          bgClass: 'from-orange-50 to-amber-50 border-orange-200',
          textColor: 'text-orange-800',
          desc: 'An administrator is currently reviewing your uploaded LGU business permit and shop configurations. We will notify you as soon as the review is complete.',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      case 'rejected':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          title: 'Application Rejected',
          bgClass: 'from-red-50 to-orange-50 border-red-200',
          textColor: 'text-red-800',
          desc: 'Your application was not approved. This usually happens if the uploaded document was blurry, expired, or failed verification checks. Please contact support to review and submit a fresh application.',
          badge: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'suspended':
        const isExpired = farm?.permit_expiry_date ? new Date(farm.permit_expiry_date) < new Date() : false;
        return {
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          title: isExpired ? 'Permit Expired / Suspended' : 'Account Suspended',
          bgClass: 'from-red-50 to-slate-100 border-red-200',
          textColor: 'text-red-900',
          desc: isExpired
            ? 'Your LGU business permit has expired. Please renew it and upload the new permit file along with the correct date issued in your Shop Configuration page.'
            : 'Your seller account has been suspended by an administrator due to a violation of our seller terms or compliance updates. To appeal this decision, please reach out to admin support.',
          badge: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
          title: 'Verified',
          bgClass: 'from-green-50 to-emerald-50 border-green-200',
          textColor: 'text-green-800',
          desc: 'Your account is verified! You can now access your seller dashboard.',
          badge: 'bg-green-100 text-green-800 border-green-200',
        };
    }
  };

  const statusConfig = renderStatusDetails();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-8 bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 transition hover:shadow-2xl">
        
        {/* Header Branding */}
        <div className="text-center">
          <span className="font-extrabold text-2xl tracking-wider text-brand">POULTRY<span className="text-slate-800">LINK</span></span>
          <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Seller Verification Portal</p>
        </div>

        {/* Dynamic Status Presentation */}
        <div className={`mt-8 rounded-2xl border bg-gradient-to-br p-6 text-center flex flex-col items-center ${statusConfig.bgClass}`}>
          <div className="mb-4">
            {statusConfig.icon}
          </div>
          
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${statusConfig.badge}`}>
            {user.status ? user.status.toUpperCase().replace('_', ' ') : 'UNKNOWN'}
          </span>
          
          <h2 className={`mt-4 text-2xl font-bold tracking-tight ${statusConfig.textColor}`}>
            {statusConfig.title}
          </h2>
          
          <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
            {statusConfig.desc}
          </p>
        </div>

        {/* Business details summary */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Submitted Shop Info</h3>
            {user.status === 'suspended' && (
              <button
                onClick={() => navigate('/seller/shop')}
                className="text-xs font-bold text-brand hover:underline"
              >
                Go to Shop Settings →
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 font-medium">Business Name</p>
              <p className="font-semibold text-slate-800">{user.business_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Full Name</p>
              <p className="font-semibold text-slate-800">{user.fullname}</p>
            </div>
            {farm?.permit_issue_date && (
              <div>
                <p className="text-slate-400 font-medium">Permit Date Issued</p>
                <p className="font-semibold text-slate-800">{new Date(farm.permit_issue_date).toLocaleDateString()}</p>
              </div>
            )}
            {farm?.permit_expiry_date && (
              <div>
                <p className="text-slate-400 font-medium">Permit Expiry Date</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  {new Date(farm.permit_expiry_date).toLocaleDateString()}
                  {new Date(farm.permit_expiry_date) < new Date() && (
                    <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 font-bold animate-pulse">EXPIRED</span>
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400 font-medium">Email Address</p>
              <p className="font-semibold text-slate-800">{user.email || 'None'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Contact Phone</p>
              <p className="font-semibold text-slate-800">{user.phone || 'None'}</p>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="space-y-4">
          {message && (
            <div className="text-center text-sm font-semibold text-brand animate-fade-in">
              {message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-brand py-3 px-4 font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Verification Status'}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 py-3 px-6 font-bold text-slate-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Need assistance? Email support at <a href="mailto:compliance@poultrylink.com" className="text-brand font-semibold hover:underline">compliance@poultrylink.com</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerVerification;
