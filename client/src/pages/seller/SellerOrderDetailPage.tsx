import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Order, Rider } from '../../types/marketplace';
import {
  formatPrice,
  formatQuantityWithUnit,
  formatUnitSuffix,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  SIZE_LABELS,
  getOrderStatusLabel,
  getAvailableOrderStatuses,
} from '../../types/marketplace';

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [savingWeights, setSavingWeights] = useState(false);

  const basePath = user?.role === 'reseller' ? '/reseller' : '/seller';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRes, ridersRes] = await Promise.all([
          api.get(`/seller/orders/${id}`),
          api.get('/seller/riders'),
        ]);
        setOrder(orderRes.data.order);
        setRiders(ridersRes.data.riders);
      } catch (err: any) {
        setError('Order not found or access denied.');
        toast.error('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const updateStatus = async (status: Order['status']) => {
    setSubmitting(true);
    try {
      const res = await api.put(`/seller/orders/${id}/status`, { status });
      setOrder((prev) => (prev ? { ...prev, status: res.data.order.status } : null));
      toast.success(`Order status updated to ${getOrderStatusLabel(status, order?.delivery_type)}.`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to update order status.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRider = async (riderId: number) => {
    setSubmitting(true);
    try {
      const res = await api.put(`/seller/orders/${id}/assign-rider`, { rider_id: riderId });
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              rider_id: res.data.order.rider_id,
              rider_name: res.data.order.rider_name,
              rider: res.data.order.rider,
            }
          : null
      );
      toast.success('Rider assigned successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to assign rider.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (order?.items) {
      const map: Record<number, string> = {};
      order.items.forEach((it) => {
        map[it.id] = String(it.actual_quantity ?? it.estimated_quantity ?? it.quantity);
      });
      setWeights(map);
    }
  }, [order]);

  const handleSaveWeights = async () => {
    setSavingWeights(true);
    try {
      const payload = {
        items: Object.entries(weights).map(([itemId, actualWeight]) => ({
          item_id: Number(itemId),
          actual_weight: parseFloat(actualWeight) || 0,
        })),
      };
      const res = await api.put(`/seller/orders/${id}/weigh`, payload);
      setOrder(res.data.order);
      toast.success('Weights confirmed and order grand total updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update weights.');
    } finally {
      setSavingWeights(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-center text-slate-500 py-24">Loading order details...</p>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="rounded-3xl bg-white p-12 text-center shadow-card">
          <p className="text-slate-500">{error ?? 'Order not found'}</p>
          <Link to={`${basePath}/orders`} className="mt-4 inline-block text-brand hover:underline">
            Back to orders
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation and Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            to={`${basePath}/orders`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand"
          >
            ← Back to orders
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark transition"
          >
            Print Invoice
          </button>
        </div>

        {/* Invoice */}
        <div ref={invoiceRef} className="rounded-3xl bg-white p-8 shadow-card print:shadow-none border border-slate-100">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1 shadow-sm border border-slate-200/80 shrink-0 overflow-hidden">
                <img src="/logo.png" alt="PoultryLink Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Invoice <span className="text-brand">#{order.id}</span>
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
              {getOrderStatusLabel(order.status, order.delivery_type)}
            </span>
          </div>

          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</h3>
              <p className="mt-1 font-medium text-slate-900">{order.customer?.fullname || 'Anonymous'}</p>
              <p className="text-sm text-slate-500">Phone: {order.phone || order.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery</h3>
              <p className="mt-1 font-medium capitalize text-slate-900">{order.delivery_type}</p>
              <p className="text-sm text-slate-500">{PAYMENT_LABELS[order.payment_method]}</p>
            </div>
          </div>

          {order.delivery_type === 'delivery' && order.address_line && (
            <div className="mb-8 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery Address</h3>
              <p className="mt-1 text-sm text-slate-700">
                {order.address_line}, {order.city}, {order.province} {order.postal_code}
              </p>
            </div>
          )}

          {order.delivery_type === 'delivery' && order.rider && (
            <div className="mb-8 rounded-2xl bg-orange-50/50 p-4 border border-orange-100 flex items-center gap-4">
              <img
                src={order.rider.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                alt={order.rider.fullname}
                className="h-12 w-12 rounded-full object-cover border border-orange-200"
              />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Assigned Rider</h3>
                <p className="mt-0.5 font-semibold text-slate-950">{order.rider.fullname}</p>
                <p className="text-xs text-slate-600">Phone: {order.rider.phone}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-semibold">Item</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold">Quantity / Weight</th>
                  <th className="pb-3 font-semibold">Unit Price</th>
                  <th className="pb-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => {
                  const unitType = item.unit_type || item.product?.unit_type;
                  const isPerKilo = unitType === 'per_kilo';
                  const hasActual = item.actual_quantity !== null && item.actual_quantity !== undefined;
                  const displayQty = hasActual
                    ? Number(item.actual_quantity)
                    : Number(item.estimated_quantity || item.quantity);
                  const isEstimated = isPerKilo && !hasActual;

                  return (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 text-slate-900">
                        <p className="font-medium">{item.product?.name ?? `Product #${item.product_id}`}</p>
                        <p className="text-xs text-slate-400">
                          {item.product?.name} — {formatQuantityWithUnit(displayQty, unitType)} @ {formatPrice(Number(item.unit_price))}{formatUnitSuffix(unitType)}
                        </p>
                      </td>
                      <td className="py-3 text-slate-600">{SIZE_LABELS[item.size] || item.size}</td>
                      <td className="py-3 text-slate-600">
                        <span className="font-medium text-slate-800">{formatQuantityWithUnit(displayQty, unitType)}</span>
                        {isEstimated && (
                          <span className="ml-1.5 inline-block text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Est.
                          </span>
                        )}
                        {hasActual && isPerKilo && (
                          <span className="ml-1.5 inline-block text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Weighed
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-600">
                        {formatPrice(Number(item.unit_price))} <span className="text-xs text-slate-400">{formatUnitSuffix(unitType)}</span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {formatPrice(Number(item.subtotal))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span>
                  {formatPrice(
                    order.items?.reduce((acc, it) => acc + Number(it.subtotal), 0) ??
                    (Number(order.total) - Number(order.shipping_fee || 0))
                  )}
                </span>
              </div>
              {order.delivery_type === 'delivery' ? (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(
                      order.shipping_fee !== undefined && order.shipping_fee !== null
                        ? Number(order.shipping_fee)
                        : Math.max(
                            0,
                            Number(order.total) -
                              (order.items?.reduce((acc, it) => acc + Number(it.subtotal), 0) ?? 0)
                          )
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-emerald-600">Free (Store Pickup)</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-base">
                <span>Total</span>
                <span className="text-xl">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <p className="mt-6 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Notes:</span> {order.notes}
            </p>
          )}

          {/* Cancellation Reason */}
          {order.status === 'cancelled' && order.cancel_reason && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-semibold text-red-800">Reason for Cancellation:</span> {order.cancel_reason}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-400 print:mt-12">
            PoultryLink · Fresh poultry marketplace · Thank you for your business!
          </p>
        </div>

        {/* Fulfillment Control Center - Print Hidden */}
        <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100 print:hidden space-y-6">
          {/* Weighing & Price Confirmation Section */}
          {order.items?.some((it) => (it.unit_type || it.product?.unit_type) === 'per_kilo') && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                    ⚖️ Record Actual Weights (kg)
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Input the exact weighed weight for each item. The grand total and customer invoice will update immediately.
                  </p>
                </div>
                {order.status === 'awaiting_weighing' && (
                  <span className="rounded-full bg-amber-200/90 px-3 py-1 text-xs font-bold text-amber-900">
                    Awaiting Weighing
                  </span>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                {order.items
                  ?.filter((it) => (it.unit_type || it.product?.unit_type) === 'per_kilo')
                  .map((it) => {
                    const val = weights[it.id] ?? '';
                    const parsed = parseFloat(val) || 0;
                    const calcSubtotal = parsed * Number(it.unit_price);

                    return (
                      <div
                        key={it.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white p-3.5 border border-amber-200/80 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">
                            {it.product?.name ?? `Item #${it.id}`} ({SIZE_LABELS[it.size] || it.size})
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Price: {formatPrice(Number(it.unit_price))}/kg · Est. Ordered: {it.estimated_quantity ?? it.quantity} kg
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium">Actual:</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.05"
                              value={val}
                              onChange={(e) =>
                                setWeights((prev) => ({ ...prev, [it.id]: e.target.value }))
                              }
                              className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-right text-sm"
                              placeholder="0.00"
                            />
                            <span className="font-bold text-slate-700 text-sm">kg</span>
                          </div>
                          <span className="min-w-[5rem] text-right font-bold text-slate-900 text-sm">
                            = {formatPrice(calcSubtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={savingWeights}
                  onClick={handleSaveWeights}
                  className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {savingWeights ? 'Saving Weights...' : 'Confirm Weight & Update Price'}
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-950 mb-3">Fulfillment Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Change status</label>
              <select
                value={order.status}
                disabled={
                  submitting ||
                  (order.delivery_type === 'delivery' &&
                    ['claimed', 'out_for_delivery'].includes(order.status))
                }
                onChange={(e) => updateStatus(e.target.value as Order['status'])}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition disabled:opacity-50"
              >
                {getAvailableOrderStatuses(
                  order.delivery_type,
                  order.items?.some((i) => i.unit_type === 'per_kilo') ?? false,
                  order.status
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {order.delivery_type === 'delivery' ? (
                ['claimed', 'out_for_delivery'].includes(order.status) ? (
                  <p className="mt-1 text-xs text-slate-500">Rider claimed delivery & manages customer drop-off.</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Mark 'Ready for Delivery' to send to rider claiming pool.</p>
                )
              ) : (
                <p className="mt-1 text-xs text-slate-500">Customer picks up and pays cash at farm.</p>
              )}
            </div>
            {order.delivery_type === 'delivery' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Assign rider</label>
                <select
                  value={order.rider_id ?? ''}
                  disabled={submitting}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      handleAssignRider(Number(val));
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition disabled:opacity-50"
                >
                  <option value="">Select rider to assign...</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.fullname} ({rider.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </Layout>
  );
}
