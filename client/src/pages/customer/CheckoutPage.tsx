import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import api from '../../lib/axios';
import Modal from '../../components/customer/Modal';
import { useCart } from '../../context/CartContext';
import type { DeliveryAddress, DeliveryType, PaymentMethod, SavedAddress } from '../../types/marketplace';
import { formatPrice } from '../../types/marketplace';

export default function CheckoutPage() {
  const { items, subtotal, savedAddress, saveAddress, clearCart } = useCart();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_pickup');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const [addressForm, setAddressForm] = useState<DeliveryAddress>(
    savedAddress ?? {
      fullName: '',
      phone: '',
      region: '',
      postalCode: '',
      streetAddress: '',
    },
  );

  useEffect(() => {
    api.get('/addresses').then((res) => {
      const list: SavedAddress[] = res.data.addresses;
      setSavedAddresses(list);
      const defaultAddr = list.find((a) => a.is_default) ?? list[0];
      if (defaultAddr && !savedAddress) {
        saveAddress({
          fullName: defaultAddr.full_name,
          phone: defaultAddr.phone,
          region: defaultAddr.region,
          postalCode: defaultAddr.postal_code,
          streetAddress: defaultAddr.street_address,
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
        <Link to="/customer/cart" className="mt-4 inline-block text-brand hover:underline">
          Go to cart
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
    saveAddress(addressForm);
    setAddressModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (deliveryType === 'delivery' && !savedAddress) {
      setError('Please add a delivery address.');
      setAddressModalOpen(true);
      return;
    }

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
        phone: savedAddress?.phone,
        notes: savedAddress ? `Recipient: ${savedAddress.fullName}` : undefined,
      });
      clearCart();
      setOrderId(res.data.order?.id ?? null);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
        <p className="mt-2 text-gray-500">
          Your order has been submitted. Pay with cash on {deliveryType === 'pickup' ? 'pickup' : 'delivery'}.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderId && (
            <Link
              to={`/customer/orders/${orderId}`}
              className="inline-block rounded-full bg-brand px-8 py-3 font-bold text-white hover:bg-brand-dark"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/customer/orders"
            className="inline-block rounded-full border-2 border-brand px-8 py-3 font-bold text-brand hover:bg-brand/5"
          >
            My Orders
          </Link>
          <Link
            to="/customer"
            className="inline-block rounded-full px-8 py-3 font-semibold text-gray-600 hover:text-brand"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/customer/cart"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cart
      </Link>

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
              onClick={() => setAddressModalOpen(true)}
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              <Plus className="h-4 w-4" />
              {savedAddress ? 'Edit Address' : 'New Address'}
            </button>
          </div>
          {savedAddress ? (
            <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{savedAddress.fullName}</p>
                <p className="text-gray-600">{savedAddress.phone}</p>
                <p className="text-gray-600">
                  {savedAddress.streetAddress}, {savedAddress.region} {savedAddress.postalCode}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No address saved yet. Click "New Address" to add one.</p>
          )}
          {savedAddresses.length > 0 && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Or choose from address book</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
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
        <ul className="space-y-2 text-sm text-gray-600">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}`} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-xl font-bold text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placing}
          className="mt-4 w-full rounded-full bg-red-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 disabled:opacity-60"
        >
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </section>

      {/* New Address Modal */}
      <Modal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} title="New Address">
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              required
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              required
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
            <input
              required
              value={addressForm.region}
              onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
              placeholder="e.g. Capiz, Western Visayas"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              required
              value={addressForm.postalCode}
              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Street Address</label>
            <textarea
              required
              rows={2}
              value={addressForm.streetAddress}
              onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 font-bold text-white hover:bg-brand-dark"
          >
            Save Address
          </button>
        </form>
      </Modal>
    </div>
  );
}
