import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import type { Order } from '../../types/marketplace';
import {
  formatPrice,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  SIZE_LABELS,
} from '../../types/marketplace';

export default function OrderDetailPage() {
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiveSuccess, setReceiveSuccess] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.order))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmReceipt = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/orders/${id}/receive`);
      setOrder(res.data.order);
      setReceiveSuccess(true);
      setTimeout(() => setReceiveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to confirm order receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/orders/${id}/cancel`, {
        reason: cancelReason.trim() || null,
      });
      setOrder(res.data.order);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500 py-24">Loading order...</p>;
  if (error || !order) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-card">
        <p className="text-gray-500">{error ?? 'Order not found'}</p>
        <Link to="/customer/orders" className="mt-4 inline-block text-brand hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Navigation and Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Cancel Order Button: Show if Pending or Confirmed (before Processing) */}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="rounded-full bg-red-50 border border-red-200 px-6 py-2.5 font-semibold text-red-600 hover:bg-red-100/50 transition"
            >
              Cancel Order
            </button>
          )}

          {/* Order Received Button: Show if status is Completed or Ready */}
          {(order.status === 'completed' || order.status === 'ready') && (
            <button
              type="button"
              onClick={handleConfirmReceipt}
              disabled={submitting}
              className="rounded-full bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Order Received'}
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>
      </div>

      {receiveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2 print:hidden">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Order confirmed as received! Thank you for buying from our local farm.
        </div>
      )}

      {/* Invoice */}
      <div ref={invoiceRef} className="rounded-2xl bg-white p-8 shadow-card print:shadow-none">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice <span className="text-brand">#{order.id}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Farm</h3>
            <p className="mt-1 font-medium text-gray-900">{order.farm?.name}</p>
            {order.farm?.location && <p className="text-sm text-gray-500">{order.farm.location}</p>}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery</h3>
            <p className="mt-1 font-medium capitalize text-gray-900">{order.delivery_type}</p>
            <p className="text-sm text-gray-500">{PAYMENT_LABELS[order.payment_method]}</p>
          </div>
        </div>

        {order.delivery_type === 'delivery' && order.address_line && (
          <div className="mb-8 rounded-xl bg-customer-bg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery Address</h3>
            <p className="mt-1 text-sm text-gray-700">
              {order.address_line}, {order.city} {order.postal_code}
            </p>
            {order.phone && <p className="text-sm text-gray-500">{order.phone}</p>}
          </div>
        )}

        {order.delivery_type === 'delivery' && order.rider && (
          <div className="mb-8 rounded-xl bg-blue-50 p-4 border border-blue-100 flex items-center gap-4">
            <img
              src={order.rider.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
              alt={order.rider.fullname}
              className="h-12 w-12 rounded-full object-cover border border-blue-200"
            />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-500">Assigned Rider</h3>
              <p className="mt-0.5 font-semibold text-gray-900">{order.rider.fullname}</p>
              <p className="text-xs text-gray-600">Phone: {order.rider.phone}</p>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-semibold">Item</th>
              <th className="pb-3 font-semibold">Size</th>
              <th className="pb-3 font-semibold">Qty</th>
              <th className="pb-3 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3 text-gray-900">{item.product?.name ?? `Product #${item.product_id}`}</td>
                <td className="py-3 text-gray-600">{SIZE_LABELS[item.size]}</td>
                <td className="py-3 text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right font-medium text-gray-900">
                  {formatPrice(Number(item.subtotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
          </div>
        </div>

        {order.notes && (
          <p className="mt-6 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Notes:</span> {order.notes}
          </p>
        )}

        {/* Cancellation Reason in Invoice */}
        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold text-red-800">Reason for Cancellation:</span> {order.cancel_reason}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 print:mt-12">
          PoultryLink · Fresh poultry marketplace · Thank you for your order!
        </p>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-red-600 mb-3">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Cancel Order</h3>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed">
              Are you sure you want to cancel this order? This action will restore product inventory and cancel delivery.
            </p>
            
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Reason for cancellation <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered by mistake..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={submitting}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-55"
              >
                {submitting ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
