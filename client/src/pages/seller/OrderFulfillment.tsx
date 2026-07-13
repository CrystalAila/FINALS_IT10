import { useState } from 'react';
import Layout from '../../components/Layout';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';
import type { Order } from '../../types/marketplace';

const sampleOrders: Order[] = [
  {
    id: 1123,
    customer_id: 3,
    farm_id: 1,
    status: 'pending',
    delivery_type: 'delivery',
    payment_method: 'cash_on_delivery',
    total: 1520,
    address_line: '123 Mabini St.',
    city: 'Roxas City',
    province: 'Capiz',
    postal_code: '5800',
    phone: '09171234567',
    rider_name: null,
    notes: 'Leave at the gate',
    created_at: '2026-07-12T10:20:00Z',
    updated_at: '2026-07-12T10:20:00Z',
    items: [],
  },
  {
    id: 1124,
    customer_id: 5,
    farm_id: 1,
    status: 'processing',
    delivery_type: 'pickup',
    payment_method: 'cash_on_pickup',
    total: 920,
    address_line: '45 Lopez Ave.',
    city: 'Ivisan',
    province: 'Capiz',
    postal_code: '5801',
    phone: '09170000000',
    rider_name: 'Rodel',
    notes: '',
    created_at: '2026-07-12T11:40:00Z',
    updated_at: '2026-07-12T11:40:00Z',
    items: [],
  },
];

const OrderFulfillment: React.FC = () => {
  const [orders, setOrders] = useState(sampleOrders);

  const updateStatus = (orderId: number, status: Order['status']) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const assignRider = (orderId: number, riderName: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, rider_name: riderName } : order)));
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Order fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage active orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Update statuses and assign riders to keep deliveries moving.</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Order #{order.id}</p>
                <p className="mt-1 text-sm text-slate-500">{order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'} • {order.payment_method.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{order.total} PHP</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Customer</p>
                <p className="mt-2 text-sm text-slate-600">{order.address_line}, {order.city}, {order.province}</p>
                <p className="mt-1 text-sm text-slate-600">{order.phone}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Rider</p>
                <p className="mt-2 text-sm text-slate-600">{order.rider_name ?? 'Not assigned'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Change status</label>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {Object.keys(ORDER_STATUS_LABELS).map((status) => (
                    <option key={status} value={status}>{ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Assign rider</label>
                <input
                  type="text"
                  value={order.rider_name ?? ''}
                  onChange={(e) => assignRider(order.id, e.target.value)}
                  placeholder="Rider name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => assignRider(order.id, order.rider_name ?? 'Rider assigned')}
                  className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default OrderFulfillment;
