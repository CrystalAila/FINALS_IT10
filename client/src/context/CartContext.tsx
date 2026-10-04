import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, DeliveryAddress, ProductSize } from '../types/marketplace';
import { useToast } from './ToastContext';

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hasUnreadCart: boolean;
  markCartAsRead: () => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: number, size: ProductSize) => void;
  removeItems: (itemsToRemove: { productId: number; size: ProductSize }[]) => void;
  updateQuantity: (productId: number, size: ProductSize, quantity: number) => void;
  clearCart: () => void;
  savedAddress: DeliveryAddress | null;
  saveAddress: (address: DeliveryAddress) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = 'poultrylink_cart';
const ADDRESS_KEY = 'poultrylink_address';
const CART_UNREAD_KEY = 'poultrylink_cart_has_unread';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadAddress(): DeliveryAddress | null {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCartUnread(): boolean {
  try {
    const raw = localStorage.getItem(CART_UNREAD_KEY);
    const cart = loadCart();
    return raw === 'true' && cart.length > 0;
  } catch {
    return false;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [savedAddress, setSavedAddress] = useState<DeliveryAddress | null>(loadAddress);
  const [hasUnreadCart, setHasUnreadCart] = useState<boolean>(loadCartUnread);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (items.length === 0) {
      setHasUnreadCart(false);
      localStorage.setItem(CART_UNREAD_KEY, 'false');
    }
  }, [items]);

  useEffect(() => {
    if (savedAddress) {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(savedAddress));
    }
  }, [savedAddress]);

  const markCartAsRead = useCallback(() => {
    setHasUnreadCart(false);
    localStorage.setItem(CART_UNREAD_KEY, 'false');
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId && i.size === item.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setHasUnreadCart(true);
    localStorage.setItem(CART_UNREAD_KEY, 'true');
    toast.success(`"${item.name}" added to cart!`);
  }, [toast]);

  const removeItem = useCallback((productId: number, size: ProductSize) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => !(i.productId === productId && i.size === size));
      if (remaining.length === 0) {
        setHasUnreadCart(false);
        localStorage.setItem(CART_UNREAD_KEY, 'false');
      }
      return remaining;
    });
  }, []);

  const removeItems = useCallback((itemsToRemove: { productId: number; size: ProductSize }[]) => {
    setItems((prev) => {
      const remaining = prev.filter(
        (item) =>
          !itemsToRemove.some(
            (r) => r.productId === item.productId && r.size === item.size,
          ),
      );
      if (remaining.length === 0) {
        setHasUnreadCart(false);
        localStorage.setItem(CART_UNREAD_KEY, 'false');
      }
      return remaining;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, size: ProductSize, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity } : i)),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setHasUnreadCart(false);
    localStorage.setItem(CART_UNREAD_KEY, 'false');
  }, []);

  const saveAddress = useCallback((address: DeliveryAddress) => setSavedAddress(address), []);

  const itemCount = useMemo(() => new Set(items.map((i) => i.productId)).size, [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        hasUnreadCart,
        markCartAsRead,
        addItem,
        removeItem,
        removeItems,
        updateQuantity,
        clearCart,
        savedAddress,
        saveAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
