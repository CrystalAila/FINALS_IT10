import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  SIZE_LABELS,
  formatPrice,
} from '../../types/marketplace';
import type { Order, Rider } from '../../types/marketplace';
import { SearchIcon } from '../../components/common/SearchIcon';

const OrderFulfillment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningRider, setAssigningRider] = useState(false);

  const basePath = user?.role === 'reseller' ? '/reseller' : '/seller';

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
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/seller/orders/${orderId}/status`, { status });
      const updated = res.data.order;
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: updated.status } : order))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: updated.status } : null));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignRider = async (orderId: number, riderId: number) => {
    setAssigningRider(true);
    try {
      const res = await api.put(`/seller/orders/${orderId}/assign-rider`, { rider_id: riderId });
      const updated = res.data.order;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                rider_id: updated.rider_id,
                rider_name: updated.rider_name,
                rider: updated.rider,
              }
            : order
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                rider_id: updated.rider_id,
                rider_name: updated.rider_name,
                rider: updated.rider,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to assign rider.');
    } finally {
      setAssigningRider(false);
    }
  };

  // Filter orders in real-time
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      // Text search filter
      if (!q) return true;
      const orderIdMatch = String(order.id).includes(q) || `#${order.id}`.includes(q);
      const customerNameMatch = order.customer?.fullname?.toLowerCase().includes(q);
      const phoneMatch = order.phone?.toLowerCase().includes(q) || order.customer?.phone?.toLowerCase().includes(q);
      const paymentMatch = order.payment_method?.toLowerCase().includes(q);
      const deliveryMatch = order.delivery_type?.toLowerCase().includes(q);
      const addressMatch = order.address_line?.toLowerCase().includes(q) || order.city?.toLowerCase().includes(q);
      return Boolean(orderIdMatch || customerNameMatch || phoneMatch || paymentMatch || deliveryMatch || addressMatch);
    });
  }, [orders, searchQuery, statusFilter]);

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready_for_pickup', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Order fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage Orders</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Real-time Search and Filter Toolbar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer, Phone..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                statusFilter === opt.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span className="ml-1.5 opacity-75">
                  ({orders.filter((o) => o.status === opt.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No active orders found.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No orders match your search or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-3 text-sm font-semibold text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Clean List / Table View (Matching MyListings.tsx layout) */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="grid gap-4 border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-500 grid-cols-2 sm:grid-cols-[1fr_1.8fr_1.4fr_1.2fr_1.2fr_1fr] items-center">
            <div>Order ID</div>
            <div>Customer</div>
            <div className="hidden sm:block">Date</div>
            <div className="hidden sm:block text-right">Total</div>
            <div className="text-right sm:text-center">Status</div>
            <div className="text-right">Action</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="grid gap-4 px-6 py-4 text-sm grid-cols-2 sm:grid-cols-[1fr_1.8fr_1.4fr_1.2fr_1.2fr_1fr] items-center cursor-pointer transition hover:bg-slate-50/80"
              >
                {/* Order ID & Type */}
                <div>
                  <p className="font-bold text-slate-900">#{order.id}</p>
                  <span className="inline-block mt-0.5 text-xs text-slate-500 capitalize">
                    {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                  </span>
                </div>

                {/* Customer */}
                <div>
                  <p className="font-semibold text-slate-800">{order.customer?.fullname || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{order.phone || order.customer?.phone || 'No phone'}</p>
                </div>

                {/* Date */}
                <div className="hidden sm:block text-xs text-slate-600">
                  <p className="font-medium text-slate-700">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    {new Date(order.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Total */}
                <div className="hidden sm:block text-right">
                  <p className="font-bold text-slate-900">{formatPrice(Number(order.total))}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </p>
                </div>

                {/* Status */}
                <div className="text-right sm:text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      ORDER_STATUS_COLORS[order.status]
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                {/* Action */}
                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand hover:border-brand hover:text-white transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Order #{selectedOrder.id}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      ORDER_STATUS_COLORS[selectedOrder.status]
                    }`}
                  >
                    {ORDER_STATUS_LABELS[selectedOrder.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
              {/* Status Update & Rider Assignment Controls */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Actions</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Update Status</label>
                    <select
                      value={selectedOrder.status}
                      disabled={
                        updatingStatus ||
                        (selectedOrder.delivery_type === 'delivery' &&
                          ['completed', 'cancelled', 'out_for_delivery'].includes(selectedOrder.status))
                      }
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value as Order['status'])}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    >
                      {Object.keys(ORDER_STATUS_LABELS)
                        .filter((status) => {
                          if (status === 'out_for_delivery') return false;
                          if (
                            selectedOrder.delivery_type === 'delivery' &&
                            (status === 'completed' || status === 'cancelled')
                          )
                            return false;
                          return true;
                        })
                        .map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                          </option>
                        ))}
                      {selectedOrder.delivery_type === 'delivery' &&
                        ['completed', 'cancelled', 'out_for_delivery'].includes(selectedOrder.status) && (
                          <option value={selectedOrder.status} className="hidden">
                            {ORDER_STATUS_LABELS[selectedOrder.status as keyof typeof ORDER_STATUS_LABELS]}
                          </option>
                        )}
                    </select>
                    {selectedOrder.delivery_type === 'delivery' && (
                      <p className="mt-1 text-[11px] text-slate-500">Rider handles delivery & completion.</p>
                    )}
                  </div>

                  {selectedOrder.delivery_type === 'delivery' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Assign Rider</label>
                      <select
                        value={selectedOrder.rider_id ?? ''}
                        disabled={assigningRider}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAssignRider(selectedOrder.id, Number(val));
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
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

              {/* Customer & Delivery Information */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedOrder.customer?.fullname || 'Anonymous'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Phone: {selectedOrder.phone || selectedOrder.customer?.phone || 'N/A'}
                  </p>
                  {selectedOrder.delivery_type === 'delivery' ? (
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Address:</span> {selectedOrder.address_line},{' '}
                      {selectedOrder.city}, {selectedOrder.province} {selectedOrder.postal_code}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 italic">Store Pickup order</p>
                  )}
                  {selectedOrder.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Notes:</span> {selectedOrder.notes}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery & Rider</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 capitalize">
                      {selectedOrder.delivery_type} • {PAYMENT_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}
                    </p>
                    {selectedOrder.delivery_type === 'delivery' ? (
                      selectedOrder.rider ? (
                        <div className="mt-3 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <img
                            src={
                              selectedOrder.rider.photo_url ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={selectedOrder.rider.fullname}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-slate-900">{selectedOrder.rider.fullname}</p>
                            <p className="text-slate-500">{selectedOrder.rider.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400 italic">No rider assigned yet</p>
                      )
                    ) : (
                      <p className="mt-3 text-xs text-slate-400 italic">Customer will pick up at store</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Order Items</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-3 py-2.5">Size</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {item.product?.name ?? `Product #${item.product_id}`}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {SIZE_LABELS[item.size] || item.size}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                            {formatPrice(Number(item.subtotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-between items-center px-1">
                  <span className="text-xs text-slate-500">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatPrice(Number(selectedOrder.total))}
                  </span>
                </div>
              </div>

              {/* Cancellation Reason if any */}
              {selectedOrder.status === 'cancelled' && selectedOrder.cancel_reason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  <span className="font-bold">Cancellation Reason:</span> {selectedOrder.cancel_reason}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/orders/${selectedOrder.id}`)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Open Full Invoice Page
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderFulfillment;
