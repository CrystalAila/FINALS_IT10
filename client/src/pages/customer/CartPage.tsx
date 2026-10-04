import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import QuantitySelector from '../../components/customer/QuantitySelector';
import { SIZE_LABELS, formatPrice, formatUnitSuffix, resolveProductImage } from '../../types/marketplace';

export default function CartPage() {
  const { toast } = useToast();
  const { items, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  // Keep track of selected item keys: `${productId}-${size}`
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    items.map((i) => `${i.productId}-${i.size}`),
  );

  // Synchronize selected keys when cart items change
  useEffect(() => {
    const currentKeys = new Set(items.map((i) => `${i.productId}-${i.size}`));
    setSelectedKeys((prev) => {
      const validPrev = prev.filter((k) => currentKeys.has(k));
      // If none were previously selected but new items arrived, select them
      if (validPrev.length === 0 && items.length > 0) {
        return items.map((i) => `${i.productId}-${i.size}`);
      }
      return validPrev;
    });
  }, [items]);

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const allSelected = items.length > 0 && selectedKeys.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map((i) => `${i.productId}-${i.size}`));
    }
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.includes(`${item.productId}-${item.size}`)),
    [items, selectedKeys],
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [selectedItems],
  );

  const hasPerKiloSelected = useMemo(
    () => selectedItems.some((item) => item.unitType === 'per_kilo'),
    [selectedItems],
  );

  // Check if selected items are from more than one farm
  const uniqueFarms = useMemo(
    () => Array.from(new Set(selectedItems.map((item) => item.farmId))),
    [selectedItems],
  );
  const hasMultipleFarms = uniqueFarms.length > 1;

  const handleCheckout = () => {
    if (selectedItems.length === 0 || hasMultipleFarms) return;

    sessionStorage.setItem(
      'poultrylink_checkout',
      JSON.stringify({
        items: selectedItems,
        fromCart: true,
        isBuyNow: false,
      }),
    );

    navigate('/customer/checkout', {
      state: {
        checkoutItems: selectedItems,
        fromCart: true,
        isBuyNow: false,
      },
    });
  };

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand accent-[#D96B27] cursor-pointer"
          />
          <span>
            Select All ({selectedItems.length}/{items.length} items)
          </span>
        </label>
      </div>

      {hasMultipleFarms && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Multiple farms selected</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Each order is fulfilled directly by an individual farm. Please select items from the same farm to check out together.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const itemKey = `${item.productId}-${item.size}`;
          const isSelected = selectedKeys.includes(itemKey);

          return (
            <div
              key={itemKey}
              className={`flex gap-3 sm:gap-4 rounded-2xl bg-white p-4 shadow-card sm:items-center border-2 transition-all ${
                isSelected ? 'border-[#D96B27]/30 shadow-sm' : 'border-transparent opacity-75'
              }`}
            >
              <div className="flex items-center pt-2 sm:pt-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItem(itemKey)}
                  className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand accent-[#D96B27] cursor-pointer"
                  aria-label={`Select ${item.name}`}
                />
              </div>

              <img
                src={resolveProductImage(item.image)}
                alt={item.name}
                className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
              />

              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.farmName}</p>
                  <p className="text-sm text-gray-400">
                    Size: {SIZE_LABELS[item.size]} · {formatPrice(item.unitPrice)} <span className="text-xs">{formatUnitSuffix(item.unitType)}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.productId, item.size, q)}
                    unitType={item.unitType}
                    step={item.incrementStep || (item.unitType === 'per_kilo' ? 0.1 : 1)}
                  />
                  <p className="min-w-[4.5rem] text-right font-bold text-gray-900 text-sm sm:text-base">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(item.productId, item.size);
                      setSelectedKeys((prev) => prev.filter((k) => k !== itemKey));
                      toast.info(`"${item.name}" removed from cart.`);
                    }}
                    className="rounded-xl px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        {hasPerKiloSelected && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <span className="font-semibold">⚖️ Note:</span> Some selected items are sold by weight (kg). The price shown is an estimate and will be confirmed once weighed by the farm.
          </div>
        )}

        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-gray-700">Total</span>
            <span className="text-xs text-gray-500">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(selectedSubtotal)}
          </span>
        </div>
        <button
          type="button"
          disabled={selectedItems.length === 0 || hasMultipleFarms}
          onClick={handleCheckout}
          className="mt-4 w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {selectedItems.length === 0
            ? 'Select Items to Check Out'
            : hasMultipleFarms
            ? 'Select Items From One Farm'
            : `Check Out (${selectedItems.length})`}
        </button>
      </div>
    </div>
  );
}
