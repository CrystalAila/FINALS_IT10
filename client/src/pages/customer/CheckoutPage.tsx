import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import FoodpandaAddressModal from '../../components/customer/FoodpandaAddressModal';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import type { CartItem, DeliveryAddress, DeliveryType, PaymentMethod, SavedAddress } from '../../types/marketplace';
import { formatPrice, formatQuantityWithUnit, formatUnitSuffix } from '../../types/marketplace';
import { MapPin, Building, FileText, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { toast } = useToast();
  const { location: customerLocation } = useCustomerLocation();
  const { items: cartItems, savedAddress, saveAddress, removeItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Load checkout items from navigation state or sessionStorage or fallback to cart
  const [checkoutData] = useState<{ items: CartItem[]; isBuyNow: boolean; fromCart: boolean }>(() => {
    const navState = location.state as { checkoutItems?: CartItem[]; isBuyNow?: boolean; fromCart?: boolean } | null;
    if (navState?.checkoutItems && navState.checkoutItems.length > 0) {
      return {
        items: navState.checkoutItems,
        isBuyNow: Boolean(navState.isBuyNow),
        fromCart: Boolean(navState.fromCart),
      };
    }
    const sessionStr = sessionStorage.getItem('poultrylink_checkout');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.items?.length > 0) {
          return {
            items: parsed.items,
            isBuyNow: Boolean(parsed.isBuyNow),
            fromCart: Boolean(parsed.fromCart),
          };
        }
      } catch (e) {
        console.error('Failed to parse checkout session data', e);
      }
    }
    // Fallback: entire cart
    return {
      items: cartItems,
      isBuyNow: false,
      fromCart: true,
    };
  });

  const { items, isBuyNow, fromCart } = checkoutData;

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_pickup');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Calculate subtotal for the items being checked out
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );

  const hasPerKilo = useMemo(
    () => items.some((i) => i.unitType === 'per_kilo'),
    [items],
  );

  // Distance mock calculator matching backend
  const calculateDistanceMock = (origin: string, destination: string) => {
    const str = origin.toLowerCase() + destination.toLowerCase();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    let val = Math.abs(hash);
    if (val >= 2147483648) {
      val = Math.abs(val - 4294967296);
    }
    return (val % 15) + 1;
  };

  const farmLocation = items.length > 0 ? (items[0].farmLocation || 'Roxas City, Capiz') : 'Roxas City, Capiz';
  const customerAddressStr = savedAddress ? `${savedAddress.streetAddress} ${savedAddress.region}` : ' ';
  
  const distanceKm = deliveryType === 'delivery' && savedAddress ? calculateDistanceMock(farmLocation, customerAddressStr) : 0;
  
  const shippingFee = deliveryType === 'delivery' && distanceKm > 0
    ? (distanceKm <= 2 ? 45 : 45 + ((distanceKm - 2) * 6))
    : 0;
    
  const totalPrice = subtotal + shippingFee;

  const [addressForm, setAddressForm] = useState<DeliveryAddress>(
    savedAddress ?? {
      fullName: '',
      phone: '',
      region: '',
      postalCode: '',
      streetAddress: '',
    },
  );

  const [editingAddressForModal, setEditingAddressForModal] = useState<SavedAddress | null>(null);

  useEffect(() => {
    api.get('/addresses').then((res) => {
      const list: SavedAddress[] = res.data.addresses ?? [];
      setSavedAddresses(list);
      const defaultAddr = list.find((a) => a.is_default) ?? list[0];
      if (defaultAddr && !savedAddress) {
        saveAddress({
          fullName: defaultAddr.full_name,
          phone: defaultAddr.phone,
          region: defaultAddr.region,
          postalCode: defaultAddr.postal_code,
          streetAddress: defaultAddr.street_address,
          floorUnit: defaultAddr.floor_unit,
          deliveryNotes: defaultAddr.delivery_notes,
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude,
        });
      }
    }).catch(() => {
      // address book optional at checkout
    });
  }, [saveAddress, savedAddress]);

  if (items.length === 0 && !success) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-card">
        <p className="text-gray-500">Nothing to checkout.</p>
        <Link to="/customer" className="mt-4 inline-block text-brand hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const handleDeliveryChange = (type: DeliveryType) => {
    setDeliveryType(type);
    setPaymentMethod(type === 'pickup' ? 'cash_on_pickup' : 'cash_on_delivery');
  };

  const handleSaveAddress = (e: FormEvent) => {
    e.preventDefault();
    saveAddress({
      ...addressForm,
      latitude: customerLocation?.latitude ?? null,
      longitude: customerLocation?.longitude ?? null,
    } as any);
    setAddressModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (deliveryType === 'delivery' && !savedAddress) {
      setError('Please add a delivery address.');
      setAddressModalOpen(true);
      return;
    }

    const noteParts: string[] = [];
    if (savedAddress?.fullName) noteParts.push(`Recipient: ${savedAddress.fullName}`);
    if (savedAddress?.floorUnit) noteParts.push(`Unit/Floor: ${savedAddress.floorUnit}`);
    if (savedAddress?.deliveryNotes) noteParts.push(`Note for rider: ${savedAddress.deliveryNotes}`);

    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({
          product_id: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        address_line: savedAddress?.streetAddress,
        city: savedAddress?.region,
        province: savedAddress?.region,
        postal_code: savedAddress?.postalCode,
        latitude: savedAddress?.latitude ?? customerLocation?.latitude ?? null,
        longitude: savedAddress?.longitude ?? customerLocation?.longitude ?? null,
        phone: savedAddress?.phone,
        notes: noteParts.length > 0 ? noteParts.join(' | ') : undefined,
      });

      // If ordered from cart, remove only the ordered items from the cart
      if (fromCart && !isBuyNow) {
        removeItems(items.map((i) => ({ productId: i.productId, size: i.size })));
      }

      sessionStorage.removeItem('poultrylink_checkout');
      setOrderId(res.data.order?.id ?? null);
      setSuccess(true);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to place order. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 uppercase tracking-wider">
          Done
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
        <p className="mt-2 text-gray-500 text-sm">
          {hasPerKilo
            ? `Your order has been submitted. Because it contains variable-weight items, the seller will weigh them to confirm the final amount before delivery/pickup.`
            : `Your order has been submitted. Pay with cash on ${deliveryType === 'pickup' ? 'pickup' : 'delivery'}.`}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {orderId && (
            <Link
              to={`/customer/orders/${orderId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/customer/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-brand/40 hover:text-brand transition"
          >
            My Orders
          </Link>
          <Link
            to="/customer"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-brand/40 hover:text-brand transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => {
          if (isBuyNow) {
            navigate(-1);
          } else {
            navigate('/customer/cart');
          }
        }}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand cursor-pointer"
      >
        {isBuyNow ? '← Back to product' : '← Back to cart'}
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Delivery type */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-gray-900">Delivery Option</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['pickup', 'delivery'] as DeliveryType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleDeliveryChange(type)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                deliveryType === type
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-brand/30'
              }`}
            >
              <p className="font-semibold capitalize text-gray-900">{type}</p>
              <p className="text-sm text-gray-500">
                {type === 'pickup' ? 'Pick up at the farm' : 'Deliver to your address'}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Payment */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-gray-900">Payment</h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-medium text-gray-800">
            {paymentMethod === 'cash_on_pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
          </p>
          <p className="text-sm text-gray-500">Pay when you receive your order</p>
        </div>
      </section>

      {/* Address */}
      {deliveryType === 'delivery' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            <button
              type="button"
              onClick={() => {
                const found = savedAddresses.find((a) => a.street_address === savedAddress?.streetAddress);
                setEditingAddressForModal(found || null);
                setAddressModalOpen(true);
              }}
              className="text-sm font-bold text-brand hover:underline cursor-pointer"
            >
              {savedAddress ? 'Edit Address & Pin' : '+ New Address & Pin'}
            </button>
          </div>
          {savedAddress ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{savedAddress.fullName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 font-mono text-xs">{savedAddress.phone}</span>
                </div>
                <p className="text-gray-700 mt-1">
                  {savedAddress.streetAddress}, {savedAddress.region} {savedAddress.postalCode}
                </p>
                {savedAddress.floorUnit && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                    <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>Unit/Landmark: {savedAddress.floorUnit}</span>
                  </p>
                )}
                {savedAddress.deliveryNotes && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 mt-1.5 w-fit">
                    <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Note for rider: {savedAddress.deliveryNotes}</span>
                  </p>
                )}
                {(savedAddress?.latitude || customerLocation?.latitude) && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-xl font-medium">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      Rider will deliver to pinned coordinates ({Number(savedAddress?.latitude ?? customerLocation?.latitude).toFixed(4)}, {Number(savedAddress?.longitude ?? customerLocation?.longitude).toFixed(4)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No address saved yet. Click "New Address & Pin" to set delivery location.</p>
          )}
          {savedAddresses.length > 0 && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Or choose from address book</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand bg-white"
                value=""
                onChange={(e) => {
                  const addr = savedAddresses.find((a) => String(a.id) === e.target.value);
                  if (addr) {
                    saveAddress({
                      fullName: addr.full_name,
                      phone: addr.phone,
                      region: addr.region,
                      postalCode: addr.postal_code,
                      streetAddress: addr.street_address,
                      floorUnit: addr.floor_unit,
                      deliveryNotes: addr.delivery_notes,
                      latitude: addr.latitude,
                      longitude: addr.longitude,
                    });
                  }
                }}
              >
                <option value="">Select saved address...</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.full_name} — {addr.street_address}
                    {addr.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

      {/* Order summary */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-gray-900">Order Summary</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}`} className="flex justify-between items-start">
              <div>
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-gray-400 text-xs block">
                  {formatQuantityWithUnit(item.quantity, item.unitType)} × {formatPrice(item.unitPrice)}{formatUnitSuffix(item.unitType)}
                </span>
              </div>
              <span className="font-semibold text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>

        {hasPerKilo && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">⚖️ Estimated Price Notice:</span> This order includes variable-weight items priced per kilo. The initial grand total is an estimate. The seller will weigh the items and update the final amount before fulfillment.
          </div>
        )}
        
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Items Price {hasPerKilo ? '(Estimated Subtotal)' : '(Subtotal)'}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {deliveryType === 'delivery' && (
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex flex-col">
                <span>Shipping Fee</span>
                {savedAddress && (
                  <span className="text-xs text-gray-400">
                    Distance: ~{distanceKm} km
                  </span>
                )}
              </div>
              <span>{formatPrice(shippingFee)}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
          <span className="text-lg font-semibold text-gray-900">
            {hasPerKilo ? 'Estimated Total Price' : 'Total Price'}
          </span>
          <span className="text-xl font-bold text-brand">{formatPrice(totalPrice)}</span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placing}
          className="mt-4 w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </section>

      {/* Foodpanda Style Address Modal */}
      <FoodpandaAddressModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        editingAddress={editingAddressForModal}
        defaultFullName={savedAddress?.fullName || ''}
        onSuccess={(saved) => {
          saveAddress({
            fullName: saved.full_name,
            phone: saved.phone,
            region: saved.region,
            postalCode: saved.postal_code,
            streetAddress: saved.street_address,
            floorUnit: saved.floor_unit,
            deliveryNotes: saved.delivery_notes,
            latitude: saved.latitude,
            longitude: saved.longitude,
          });
          setSavedAddresses((prev) => {
            const exists = prev.some((a) => a.id === saved.id);
            if (exists) return prev.map((a) => (a.id === saved.id ? saved : a));
            return [saved, ...prev];
          });
        }}
      />
    </div>
  );
}
