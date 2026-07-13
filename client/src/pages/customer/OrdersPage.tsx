import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import api from '../../lib/axios';
import type { Order } from '../../types/marketplace';
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading orders...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500">Track and view your order history</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {orders.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-card">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No orders yet.</p>
          <Link to="/customer" className="mt-4 inline-block text-brand hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/customer/orders/${order.id}`}
                className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-card transition hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {order.farm?.name ?? 'Farm'} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{formatPrice(Number(order.total))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
