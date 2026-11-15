import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  SIZE_LABELS,
  formatPrice,
  formatQuantityWithUnit,
  formatUnitSuffix,
  getOrderStatusLabel,
  getAvailableOrderStatuses,
} from '../../types/marketplace';
import type { Order, Rider } from '../../types/marketplace';
import { SearchIcon } from '../../components/common/SearchIcon';

const OrderFulfillment: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
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

  // Actual weights management for variable weight orders
  const [modalWeights, setModalWeights] = useState<Record<number, string>>({});
  const [savingWeights, setSavingWeights] = useState(false);

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
        toast.error('Failed to load orders.');
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
      toast.success(`Order #${orderId} marked as ${getOrderStatusLabel(status, selectedOrder?.delivery_type)}.`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to update order status.';
      toast.error(errMsg);
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
      toast.success('Rider assigned successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to assign rider.';
      toast.error(errMsg);
    } finally {
      setAssigningRider(false);
    }
  };

  // Sync weights when selectedOrder changes
  useEffect(() => {
    if (selectedOrder?.items) {
      const map: Record<number, string> = {};
      selectedOrder.items.forEach((it) => {
        map[it.id] = String(it.actual_quantity ?? it.estimated_quantity ?? it.quantity);
      });
      setModalWeights(map);
    }
  }, [selectedOrder]);

  const handleConfirmWeights = async () => {
    if (!selectedOrder) return;
    setSavingWeights(true);
    try {
      const payload = {
        items: Object.entries(modalWeights).map(([itemId, actualWeight]) => ({
          item_id: Number(itemId),
          actual_weight: parseFloat(actualWeight) || 0,
        })),
      };
      const res = await api.put(`/seller/orders/${selectedOrder.id}/weigh`, payload);
      const updatedOrder = res.data.order;
      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      toast.success(`Order #${selectedOrder.id} weights confirmed and total updated!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update weights.');
    } finally {
      setSavingWeights(false);
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
    { value: 'all', label: 'All' },
    { value: 'awaiting_weighing', label: '⚖️ To Weigh' },
    { value: 'price_confirmed', label: 'Price Confirmed' },
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
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Real-time Search and Filter Toolbar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm max-w-md">
          <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === opt.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span className="ml-1 opacity-75">
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
          <p className="text-slate-500">No orders match your search.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-2 text-sm font-semibold text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Clean Simple Table (Columns: Order, Customer, Date, Total, Status, Actions) */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Order</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer transition hover:bg-slate-50/80"
                  >
                    {/* Order Column */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>
                        <span>#{order.id}</span>
                        <span className="ml-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                          {order.delivery_type}
                        </span>
                      </div>
                    </td>

                    {/* Customer Column */}
                    <td className="py-4 px-4 text-slate-800">
                      <p className="font-semibold">{order.customer?.fullname || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400">{order.phone || order.customer?.phone || ''}</p>
                    </td>

                    {/* Date Column */}
                    <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Total Column */}
                    <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatPrice(Number(order.total))}
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          ORDER_STATUS_COLORS[order.status]
                        }`}
                      >
                        {getOrderStatusLabel(order.status, order.delivery_type)}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand hover:border-brand hover:text-white transition shadow-2xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    {getOrderStatusLabel(selectedOrder.status, selectedOrder.delivery_type)}
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
                          ['claimed', 'out_for_delivery'].includes(selectedOrder.status))
                      }
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value as Order['status'])}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    >
                      {getAvailableOrderStatuses(
                        selectedOrder.delivery_type,
                        selectedOrder.items?.some((i) => i.unit_type === 'per_kilo') ?? false,
                        selectedOrder.status
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {selectedOrder.delivery_type === 'delivery' ? (
                      ['claimed', 'out_for_delivery'].includes(selectedOrder.status) ? (
                        <p className="mt-1 text-[11px] text-slate-500">Rider claimed delivery & manages customer drop-off.</p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-500">Mark 'Ready for Delivery' to send to rider claiming pool.</p>
                      )
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">Customer picks up and pays cash at farm.</p>
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

              {/* Weighing & Price Confirmation Section */}
              {selectedOrder.items?.some(
                (it) => (it.unit_type || it.product?.unit_type) === 'per_kilo'
              ) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        ⚖️ Record Actual Weights (kg)
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Input exact weight for weighted poultry. Subtotals and order total will automatically update.
                      </p>
                    </div>
                    {selectedOrder.status === 'awaiting_weighing' && (
                      <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                        Awaiting Weighing
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    {selectedOrder.items
                      ?.filter((it) => (it.unit_type || it.product?.unit_type) === 'per_kilo')
                      .map((it) => {
                        const val = modalWeights[it.id] ?? '';
                        const parsed = parseFloat(val) || 0;
                        const calcSubtotal = parsed * Number(it.unit_price);

                        return (
                          <div
                            key={it.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white p-3 border border-amber-200/70 text-xs"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">
                                {it.product?.name ?? `Item #${it.id}`} ({SIZE_LABELS[it.size] || it.size})
                              </p>
                              <p className="text-slate-500 text-[11px]">
                                Price: {formatPrice(Number(it.unit_price))}/kg · Est. Ordered: {it.estimated_quantity ?? it.quantity} kg
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <label className="text-slate-600 font-medium">Actual:</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.05"
                                  value={val}
                                  onChange={(e) =>
                                    setModalWeights((prev) => ({ ...prev, [it.id]: e.target.value }))
                                  }
                                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-1 font-semibold text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-right"
                                  placeholder="0.00"
                                />
                                <span className="font-bold text-slate-600">kg</span>
                              </div>
                              <span className="min-w-[4rem] text-right font-bold text-slate-800">
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
                      onClick={handleConfirmWeights}
                      className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      {savingWeights ? 'Saving Weights...' : 'Confirm Weight & Update Price'}
                    </button>
                  </div>
                </div>
              )}

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
                        <th className="px-3 py-2.5">Qty / Weight</th>
                        <th className="px-3 py-2.5">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => {
                        const unitType = item.unit_type || item.product?.unit_type;
                        const isPerKilo = unitType === 'per_kilo';
                        const hasActual = item.actual_quantity !== null && item.actual_quantity !== undefined;
                        const displayQty = hasActual
                          ? Number(item.actual_quantity)
                          : Number(item.estimated_quantity || item.quantity);
                        const isEstimated = isPerKilo && !hasActual;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-slate-800">
                              <p className="font-medium">{item.product?.name ?? `Product #${item.product_id}`}</p>
                              <p className="text-[11px] text-slate-400">
                                {item.product?.name} — {formatQuantityWithUnit(displayQty, unitType)} @ {formatPrice(Number(item.unit_price))}{formatUnitSuffix(unitType)}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {SIZE_LABELS[item.size] || item.size}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              <span className="font-semibold">{formatQuantityWithUnit(displayQty, unitType)}</span>
                              {isEstimated && (
                                <span className="ml-1.5 inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                  Est.
                                </span>
                              )}
                              {hasActual && isPerKilo && (
                                <span className="ml-1.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                  Weighed
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {formatPrice(Number(item.unit_price))} <span className="text-[11px] text-slate-400">{formatUnitSuffix(unitType)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                              {formatPrice(Number(item.subtotal))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 px-1">
                  {selectedOrder.delivery_type === 'delivery' && (
                    <>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Items Subtotal</span>
                        <span>
                          {formatPrice(
                            selectedOrder.items?.reduce((acc, it) => acc + Number(it.subtotal), 0) ??
                            (Number(selectedOrder.total) - Number(selectedOrder.shipping_fee || 0))
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Delivery Fee</span>
                        <span className="font-medium text-slate-700">
                          {formatPrice(
                            selectedOrder.shipping_fee !== undefined && selectedOrder.shipping_fee !== null
                              ? Number(selectedOrder.shipping_fee)
                              : Math.max(
                                  0,
                                  Number(selectedOrder.total) -
                                    (selectedOrder.items?.reduce((acc, it) => acc + Number(it.subtotal), 0) ?? 0)
                                )
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(Number(selectedOrder.total))}
                    </span>
                  </div>
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
