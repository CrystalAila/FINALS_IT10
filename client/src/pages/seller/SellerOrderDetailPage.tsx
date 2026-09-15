import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import type { Order, Rider } from '../../types/marketplace';
import {
  formatPrice,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  SIZE_LABELS,
} from '../../types/marketplace';

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update order status.');
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
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to assign rider.');
    } finally {
      setSubmitting(false);
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
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark transition"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>

        {/* Invoice */}
        <div ref={invoiceRef} className="rounded-3xl bg-white p-8 shadow-card print:shadow-none border border-slate-100">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Invoice <span className="text-brand">#{order.id}</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
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

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 font-semibold">Item</th>
                <th className="pb-3 font-semibold">Size</th>
                <th className="pb-3 font-semibold">Qty</th>
                <th className="pb-3 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-3 text-slate-900">{item.product?.name ?? `Product #${item.product_id}`}</td>
                  <td className="py-3 text-slate-600">{SIZE_LABELS[item.size] || item.size}</td>
                  <td className="py-3 text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right font-medium text-slate-900">
                    {formatPrice(Number(item.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{formatPrice(Number(order.total))}</p>
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
        <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100 print:hidden space-y-4">
          <h2 className="text-lg font-bold text-slate-950">Fulfillment Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Change status</label>
              <select
                value={order.status}
                disabled={submitting || (order.delivery_type === 'delivery' && ['completed', 'cancelled', 'out_for_delivery'].includes(order.status))}
                onChange={(e) => updateStatus(e.target.value as Order['status'])}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition disabled:opacity-50"
              >
                {Object.keys(ORDER_STATUS_LABELS).filter(status => {
                  if (status === 'out_for_delivery') return false;
                  if (order.delivery_type === 'delivery' && (status === 'completed' || status === 'cancelled')) return false;
                  return true;
                }).map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                  </option>
                ))}
                {(order.delivery_type === 'delivery' && ['completed', 'cancelled', 'out_for_delivery'].includes(order.status)) && (
                  <option value={order.status} className="hidden">{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}</option>
                )}
              </select>
              {order.delivery_type === 'delivery' && (
                <p className="mt-1 text-xs text-slate-500">Rider handles final delivery statuses.</p>
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
    </Layout>
  );
}
