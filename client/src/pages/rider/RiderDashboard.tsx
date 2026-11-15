import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';
import type { Order } from '../../types/marketplace';
import { Truck, Package, MapPin, Phone, CheckCircle2, Navigation, ArrowRight, XCircle, Clock } from 'lucide-react';

const RiderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'available'>('my');
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [riderInfo, setRiderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // If user status is not verified/active, fetch rider application details instead of deliveries
      if (user && user.status !== 'verified' && user.status !== 'active') {
        try {
          const appRes = await api.get('/rider/application');
          if (appRes.data?.rider) {
            setRiderInfo(appRes.data.rider);
          }
        } catch {
          // ignore
        }
        setOrders([]);
        setAvailableOrders([]);
        return;
      }

      const [myRes, availRes] = await Promise.all([
        api.get('/rider/orders'),
        api.get('/rider/available-orders'),
      ]);
      setOrders(myRes.data.orders || []);
      setAvailableOrders(availRes.data.orders || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load delivery orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.status]);

  const handleClaim = async (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to claim Order #${orderId} for delivery?`)) {
      return;
    }
    setClaimingId(orderId);
    try {
      await api.post(`/rider/orders/${orderId}/claim`);
      setClaimSuccess(`Order #${orderId} claimed successfully!`);
      setTimeout(() => setClaimSuccess(null), 4000);
      await loadData();
      setActiveTab('my');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to claim order. It might have already been taken.');
      loadData();
    } finally {
      setClaimingId(null);
    }
  };

  const activeDeliveriesCount = orders.filter((o) =>
    ['confirmed', 'processing', 'ready', 'ready_for_delivery', 'claimed', 'out_for_delivery'].includes(o.status)
  ).length;

  return (
    <Layout>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">Independent Rider Portal</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">Delivery Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            View your delivery routes, claim available farm orders, and navigate to customer addresses.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm text-center">
            <span className="block text-[11px] font-bold uppercase text-slate-400">Active Deliveries</span>
            <span className="text-lg font-bold text-slate-900">{activeDeliveriesCount}</span>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm text-center">
            <span className="block text-[11px] font-bold uppercase text-amber-700">Available to Claim</span>
            <span className="text-lg font-bold text-amber-900">{availableOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Rejection Status Banner */}
      {user?.status === 'rejected' && (
        <div className="mb-6 rounded-3xl border-2 border-rose-200 bg-rose-50/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-rose-900">Application Rejected</h3>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold uppercase text-rose-800 border border-rose-300">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-rose-800">
                  Your rider registration application was reviewed and rejected by an administrator.
                  {riderInfo?.rejection_reason && (
                    <span className="block mt-1 font-semibold italic text-slate-900">
                      Reason: "{riderInfo.rejection_reason}"
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  You can edit your personal details, re-upload your 2x2 photo, and re-upload your Driver’s License to resubmit for approval.
                </p>
              </div>
            </div>

            <Link
              to="/rider/application"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition shrink-0"
            >
              Edit & Resubmit Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Pending Status Banner */}
      {user?.status === 'pending' && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-amber-900">Application Pending Review</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase text-amber-800 border border-amber-300">
                    Under Review
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-amber-800">
                  Your registration application has been submitted and is waiting for administrator approval. Delivery order claiming will become active once verified.
                </p>
              </div>
            </div>

            <Link
              to="/rider/application"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white hover:bg-amber-50 px-5 py-2.5 text-xs sm:text-sm font-bold text-amber-900 shadow-sm transition shrink-0"
            >
              View / Edit Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Alerts */}
      {claimSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{claimSuccess}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'my'
              ? 'bg-[#D96B27] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Truck className="h-4 w-4" />
          My Deliveries ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'available'
              ? 'bg-[#D96B27] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Package className="h-4 w-4" />
          Available to Claim ({availableOrders.length})
          {availableOrders.length > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-card">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading delivery orders...</p>
        </div>
      ) : activeTab === 'my' ? (
        /* My Assigned Deliveries */
        orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-card">
            {user?.status === 'rejected' ? (
              <>
                <XCircle className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Application Rejected</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Deliveries are disabled because your application was rejected. Please review any feedback, update your details, and resubmit for approval.
                </p>
                <Link
                  to="/rider/application"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
                >
                  Edit & Resubmit Application
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : user?.status === 'pending' ? (
              <>
                <Clock className="mx-auto h-12 w-12 text-amber-400 animate-pulse" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Application Pending Approval</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Your application is currently under administrator review. Once verified, active deliveries assigned to you will show here.
                </p>
                <Link
                  to="/rider/application"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-5 py-2.5 text-xs font-bold text-amber-900 shadow-sm transition"
                >
                  View / Edit Application Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Truck className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-800">You have no active deliveries right now</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Check the "Available to Claim" tab to pick up newly placed farm orders in your area!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('available')}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
                >
                  Browse Available Deliveries
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/rider/orders/${order.id}`)}
                className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card hover:border-brand/40 hover:shadow-md transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-brand font-bold shrink-0">
                      #{order.id}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Order #{order.id}
                        <span className="font-normal text-xs text-slate-400">
                          • {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pickup Farm: <strong className="text-slate-800">{order.farm?.name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                      ₱{order.total} PHP
                    </span>
                    <span className="text-xs text-brand font-semibold group-hover:translate-x-0.5 transition hidden sm:inline-flex items-center gap-1">
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* Pickup & Destination Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-3">
                    <span className="font-bold text-[10px] uppercase text-amber-800 tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-600" />
                      Pickup Origin (Farm)
                    </span>
                    <p className="font-semibold text-slate-900 mt-1">{order.farm?.name || 'Local Farm'}</p>
                    <p className="text-slate-600 mt-0.5">{order.farm?.location || 'Roxas City, Capiz'}</p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-3">
                    <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-emerald-600" />
                      Delivery Destination (Customer)
                    </span>
                    <p className="font-semibold text-slate-900 mt-1">{order.customer?.fullname || 'Customer'}</p>
                    <p className="text-slate-600 mt-0.5">
                      {order.address_line}, {order.city}, {order.province}
                    </p>
                    <p className="text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {order.phone || order.customer?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Available Orders to Claim */
        availableOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-card">
            {user?.status === 'rejected' ? (
              <>
                <XCircle className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Order Claiming Paused (Application Rejected)</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  You cannot claim farm deliveries while your application is rejected. Please update your details and resubmit for approval.
                </p>
                <Link
                  to="/rider/application"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
                >
                  Edit & Resubmit Application
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : user?.status === 'pending' ? (
              <>
                <Clock className="mx-auto h-12 w-12 text-amber-400 animate-pulse" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Order Claiming Locked (Pending Approval)</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Once an administrator reviews and approves your documents, available orders ready for delivery will appear here.
                </p>
              </>
            ) : (
              <>
                <Package className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-800">No available orders to claim right now</h3>
                <p className="mt-1 text-sm text-slate-500">
                  When a poultry farm confirms a new delivery order, it will appear here for you to claim!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card transition hover:border-brand/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand font-bold shrink-0">
                      #{order.id}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Order #{order.id} • Available for Delivery
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Placed on {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Order</p>
                      <p className="text-base font-bold text-slate-900">₱{order.total}</p>
                    </div>

                    <button
                      type="button"
                      disabled={claimingId === order.id}
                      onClick={(e) => handleClaim(e, order.id)}
                      className="rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {claimingId === order.id ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4" />
                          Claim Delivery
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Pickup Location</span>
                    <p className="font-semibold text-slate-900 mt-1">{order.farm?.name || 'Local Farm'}</p>
                    <p className="text-slate-600 mt-0.5">{order.farm?.location || 'Roxas City, Capiz'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Drop-off Destination</span>
                    <p className="font-semibold text-slate-900 mt-1">{order.customer?.fullname || 'Customer'}</p>
                    <p className="text-slate-600 mt-0.5">
                      {order.address_line}, {order.city}, {order.province}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Layout>
  );
};

export default RiderDashboard;
