import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
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

  if (loading) return <p className="text-center text-gray-500">Loading order...</p>;
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
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>

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

        <p className="mt-8 text-center text-xs text-gray-400 print:mt-12">
          PoultryLink · Fresh poultry marketplace · Thank you for your order!
        </p>
      </div>
    </div>
  );
}
