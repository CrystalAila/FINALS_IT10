import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';
import type { Order, Rider } from '../../types/marketplace';

const OrderFulfillment: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, ridersRes] = await Promise.all([
          api.get('/seller/orders'),
          api.get('/seller/riders'),
        ]);
        setOrders(ordersRes.data.orders);
        setRiders(ridersRes.data.riders);
      } catch (err: any) {
        setError('Failed to load fulfillment data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateStatus = async (orderId: number, status: Order['status']) => {
    try {
      const res = await api.put(`/seller/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: res.data.order.status } : order))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update order status.');
    }
  };

  const handleAssignRider = async (orderId: number, riderId: number) => {
    try {
      const res = await api.put(`/seller/orders/${orderId}/assign-rider`, { rider_id: riderId });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, rider_id: res.data.order.rider_id, rider_name: res.data.order.rider_name, rider: res.data.order.rider }
            : order
        )
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to assign rider.');
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Order fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage active orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Update statuses and assign riders to keep deliveries moving.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No active orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'} • {order.payment_method.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed on: {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">₱{order.total} PHP</span>
                </div>
              </div>

              {/* Items listing */}
              <div className="mt-4 border-t border-b border-slate-100 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Order Items</p>
                <ul className="space-y-1">
                  {order.items?.map((item) => (
                    <li key={item.id} className="text-sm text-slate-700 flex justify-between">
                      <span>{item.product?.name ?? `Product #${item.product_id}`} <span className="text-slate-400">({item.size})</span> x {item.quantity}</span>
                      <span className="font-medium">₱{Number(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Customer Details</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{order.customer?.fullname || 'Anonymous'}</p>
                  {order.delivery_type === 'delivery' ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {order.address_line}, {order.city}, {order.province} {order.postal_code}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500 italic">For store pickup</p>
                  )}
                  <p className="mt-1 text-sm text-slate-600">Phone: {order.phone || order.customer?.phone || 'N/A'}</p>
                  {order.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic">Notes: "{order.notes}"</p>
                  )}
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Assigned Rider</p>
                    {order.delivery_type === 'delivery' ? (
                      order.rider ? (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={order.rider.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={order.rider.fullname}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="text-sm">
                            <p className="font-semibold text-slate-800">{order.rider.fullname}</p>
                            <p className="text-xs text-slate-500">{order.rider.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500 italic">No rider assigned yet</p>
                      )
                    ) : (
                      <p className="mt-2 text-sm text-slate-500 italic">Not applicable for pickup orders</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Change status</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    {Object.keys(ORDER_STATUS_LABELS).map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                      </option>
                    ))}
                  </select>
                </div>
                {order.delivery_type === 'delivery' && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Assign rider</label>
                    <select
                      value={order.rider_id ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleAssignRider(order.id, Number(val));
                        }
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
          ))}
        </div>
      )}
    </Layout>
  );
};

export default OrderFulfillment;
