import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/marketplace';
import type { Order } from '../../types/marketplace';

const RiderOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/rider/orders/${id}`);
        setOrder(res.data.order);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: Order['status']) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.put(`/rider/orders/${order.id}/status`, { status: newStatus });
      setOrder(res.data.order);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-12 text-center text-slate-500">Loading order details...</div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
          <p>{error || 'Order not found'}</p>
          <button onClick={() => navigate('/rider/dashboard')} className="mt-4 font-semibold hover:underline">
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/rider/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          ← Back to deliveries
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Order #{order.id}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Delivery Details</h1>
        </div>
        <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Customer & Destination</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-500">Customer Name</p>
                <p className="mt-1 font-medium text-slate-900">{order.customer?.fullname || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Contact Number</p>
                <p className="mt-1 font-medium text-slate-900">{order.phone || order.customer?.phone || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-500">Delivery Address</p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.address_line}, {order.city}, {order.province} {order.postal_code}
                </p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-500">Delivery Notes</p>
                  <p className="mt-1 text-sm italic text-slate-700">"{order.notes}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-200">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">No Img</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.product?.name ?? `Product #${item.product_id}`}</p>
                      <p className="text-sm text-slate-500">Size: <span className="capitalize">{item.size}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">₱{Number(item.subtotal)}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Update Status</h2>
            
            {['completed', 'cancelled'].includes(order.status) ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600">
                This order is {order.status}. Status can no longer be changed.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {order.status !== 'out_for_delivery' && (
                  <button
                    onClick={() => updateStatus('out_for_delivery')}
                    disabled={updating}
                    className="w-full rounded-2xl bg-indigo-100 px-4 py-3 font-bold text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
                  >
                    Set to Out for Delivery
                  </button>
                )}
                
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating}
                  className="w-full rounded-2xl bg-green-100 px-4 py-3 font-bold text-green-700 hover:bg-green-200 disabled:opacity-50"
                >
                  Mark as Completed
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this delivery?')) {
                      updateStatus('cancelled');
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-2xl bg-red-100 px-4 py-3 font-bold text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  Mark as Cancelled
                </button>
              </div>
            )}
          </div>
          
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Summary</h2>
            <div className="space-y-2 border-b border-slate-100 pb-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{order.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="capitalize">{order.payment_method.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-lg font-bold text-slate-900">
              <span>Total to Collect</span>
              <span className="text-brand">₱{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RiderOrderDetails;
