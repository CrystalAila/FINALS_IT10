import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QuantitySelector from '../../components/customer/QuantitySelector';
import { SIZE_LABELS, formatPrice } from '../../types/marketplace';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-card">
        <p className="text-lg text-gray-500">Your cart is empty.</p>
        <Link
          to="/customer"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}`}
            className="flex gap-4 rounded-2xl bg-white p-4 shadow-card sm:items-center"
          >
            <img
              src={item.image ?? 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=120'}
              alt={item.name}
              className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
            />
            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.farmName}</p>
                <p className="text-sm text-gray-400">
                  Size: {SIZE_LABELS[item.size]} · {formatPrice(item.unitPrice)} each
                </p>
              </div>
              <div className="flex items-center gap-4">
                <QuantitySelector
                  value={item.quantity}
                  onChange={(q) => updateQuantity(item.productId, item.size, q)}
                />
                <p className="min-w-[5rem] text-right font-bold text-gray-900">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.size)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <span className="text-lg font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/customer/checkout')}
          className="mt-4 w-full rounded-full bg-red-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
        >
          Check Out
        </button>
      </div>
    </div>
  );
}
