import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';
import type { Order } from '../../types/marketplace';

const RiderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/rider/orders');
        setOrders(res.data.orders);
      } catch (err: any) {
        setError('Failed to load assigned orders.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Rider Portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your assigned deliveries</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">View and update the status of deliveries assigned to you.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">You have no assigned deliveries right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/rider/orders/${order.id}`)}
              className="cursor-pointer hover:border-brand/40 hover:shadow-md transition rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Farm: {order.farm?.name} • {order.payment_method.replace(/_/g, ' ')}
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

              <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Customer Details</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{order.customer?.fullname || 'Anonymous'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {order.address_line}, {order.city}, {order.province} {order.postal_code}
                </p>
                <p className="mt-1 text-sm text-slate-600">Phone: {order.phone || order.customer?.phone || 'N/A'}</p>
                {order.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic">Notes: "{order.notes}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default RiderDashboard;
