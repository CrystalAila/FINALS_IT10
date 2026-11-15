export type ProductSize = 'small' | 'medium' | 'large' | 'jumbo';
export type UnitType = 'per_kilo' | 'per_head' | 'per_tray' | 'per_piece';

export const UNIT_LABELS: Record<UnitType, string> = {
  per_kilo: 'Per Kilo (kg)',
  per_head: 'Per Head',
  per_tray: 'Per Tray',
  per_piece: 'Per Piece',
};

export const UNIT_SUFFIXES: Record<UnitType, string> = {
  per_kilo: '/ kg',
  per_head: '/ head',
  per_tray: '/ tray',
  per_piece: '/ pc',
};

export function formatUnitSuffix(unitType?: string | null): string {
  if (!unitType) return '';
  return UNIT_SUFFIXES[unitType as UnitType] || `/${unitType.replace('per_', ' ')}`;
}

export function formatQuantityWithUnit(qty: number | string, unitType?: string | null): string {
  const num = Number(qty || 0);
  const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  switch (unitType) {
    case 'per_kilo':
      return `${formattedNum} kg`;
    case 'per_head':
      return `${formattedNum} ${num === 1 ? 'head' : 'heads'}`;
    case 'per_tray':
      return `${formattedNum} ${num === 1 ? 'tray' : 'trays'}`;
    case 'per_piece':
      return `${formattedNum} ${num === 1 ? 'pc' : 'pcs'}`;
    default:
      return `${formattedNum}`;
  }
}

export type Farm = {
  id: number;
  name: string;
  location?: string;
  rating?: string | number;
  permit_status?: string;
  description?: string;
  is_verified?: boolean;
  is_permit_expired?: boolean;
  permit_expiry_date?: string;
  logo?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  full_address?: string | null;
};

export type Product = {
  id: number;
  farm_id: number;
  name: string;
  description?: string;
  image?: string | null;
  category: string;
  unit_type?: UnitType;
  increment_step?: string | number;
  price_small: string | number;
  price_medium: string | number;
  price_large: string | number;
  price_jumbo: string | number;
  stock: number;
  stock_small: number;
  stock_medium: number;
  stock_large: number;
  stock_jumbo: number;
  farm_origin?: string | null;
  rating: string | number;
  is_active: boolean;
  farm?: Farm;
};

export type CartItem = {
  productId: number;
  name: string;
  image: string | null;
  farmId: number;
  farmName: string;
  farmLocation?: string;
  category?: string;
  unitType?: UnitType;
  incrementStep?: number;
  size: ProductSize;
  quantity: number;
  unitPrice: number;
};

export type DeliveryAddress = {
  fullName: string;
  phone: string;
  region: string;
  postalCode: string;
  streetAddress: string;
  floorUnit?: string | null;
  deliveryNotes?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type DeliveryType = 'pickup' | 'delivery';
export type PaymentMethod = 'cash_on_pickup' | 'cash_on_delivery';

export const SIZE_LABELS: Record<ProductSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  jumbo: 'Jumbo',
};

export function priceForSize(product: Product, size: ProductSize): number {
  const map: Record<ProductSize, string | number> = {
    small: product.price_small,
    medium: product.price_medium,
    large: product.price_large,
    jumbo: product.price_jumbo,
  };
  return Number(map[size]);
}

export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function priceRange(product: Product): string {
  const prices = [
    Number(product.price_small),
    Number(product.price_medium),
    Number(product.price_large),
    Number(product.price_jumbo),
  ].filter((p) => p > 0);
  if (prices.length === 0) return formatPrice(0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function displayRating(rating: string | number): string {
  return Number(rating).toFixed(1);
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  eggs: 'https://images.unsplash.com/photo-1582722879805-a7e02e48a2e8?w=600&h=450&fit=crop',
  native: '/hero-poultry.jpg',
  live_poultry: '/hero-poultry.jpg',
  dressed_chicken: 'https://images.unsplash.com/photo-1598103442097-8b0287c7d889?w=600&h=450&fit=crop',
  dressed_meat: 'https://images.unsplash.com/photo-1598103442097-8b0287c7d889?w=600&h=450&fit=crop',
  broiler: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=450&fit=crop',
};

export function getProductCategoryDefaultImage(category?: string): string {
  if (category && DEFAULT_CATEGORY_IMAGES[category]) {
    return DEFAULT_CATEGORY_IMAGES[category];
  }
  return DEFAULT_CATEGORY_IMAGES.broiler;
}

export function resolveProductImage(image?: string | null, category?: string): string {
  if (!image || !image.trim() || image.includes('1612817288484-6f916006741a')) {
    return getProductCategoryDefaultImage(category);
  }

  let resolved = image.trim();

  // If this is a local blob or data preview, return immediately
  if (resolved.startsWith('blob:') || resolved.startsWith('data:')) {
    return resolved;
  }

  // Get backend base URL
  const backendBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://192.168.254.104.nip.io:8000').replace(/\/api\/?$/, '');

  // Normalize legacy localhost URLs without port 8000 or relative paths
  if (resolved.startsWith('http://localhost/storage/')) {
    resolved = resolved.replace('http://localhost/storage/', `${backendBase}/storage/`);
  } else if (resolved.startsWith('http://127.0.0.1/storage/')) {
    resolved = resolved.replace('http://127.0.0.1/storage/', `${backendBase}/storage/`);
  } else if (resolved.startsWith('/storage/')) {
    resolved = `${backendBase}${resolved}`;
  } else if (resolved.startsWith('storage/')) {
    resolved = `${backendBase}/${resolved}`;
  }

  return resolved;
}

export type OrderStatus =
  | 'pending'
  | 'awaiting_weighing'
  | 'price_confirmed'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'ready_for_delivery'
  | 'claimed'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type Rider = {
  id: number;
  user_id?: number | null;
  farm_id?: number | null;
  fullname: string;
  phone: string;
  address?: string | null;
  photo_path?: string | null;
  photo_url?: string;
  license_photo_path?: string | null;
  license_photo_url?: string;
  vehicle_type?: string | null;
  plate_number?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  user?: any;
};

export type OrderItem = {
  id: number;
  order_id?: number;
  product_id: number;
  size: ProductSize;
  unit_type?: UnitType;
  quantity: number;
  estimated_quantity?: string | number;
  actual_quantity?: string | number | null;
  unit_price: string | number;
  subtotal: string | number;
  product?: Pick<Product, 'id' | 'name' | 'image' | 'category' | 'unit_type'>;
};

export type Order = {
  id: number;
  customer_id: number;
  farm_id: number;
  status: OrderStatus;
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  total: string | number;
  shipping_fee?: string | number | null;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string | null;
  rider_name?: string | null;
  rider_id?: number | null;
  rider?: Rider | null;
  notes?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  farm?: Farm;
  items?: OrderItem[];
  customer?: {
    id: number;
    fullname: string;
    username: string;
    phone?: string | null;
  };
};

export type SavedAddress = {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  region: string;
  postal_code: string;
  street_address: string;
  floor_unit?: string | null;
  delivery_notes?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  awaiting_weighing: 'Awaiting Weighing',
  price_confirmed: 'Price Confirmed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  ready_for_delivery: 'Ready for Delivery',
  claimed: 'Claimed by Rider',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function getOrderStatusLabel(status: OrderStatus, deliveryType?: DeliveryType): string {
  if (status === 'ready') {
    return deliveryType === 'delivery' ? 'Ready for Delivery' : 'Ready for Pickup';
  }
  return ORDER_STATUS_LABELS[status] || status;
}

export function getAvailableOrderStatuses(
  deliveryType?: DeliveryType,
  hasPerKilo: boolean = false,
  currentStatus?: OrderStatus
): Array<{ value: OrderStatus; label: string }> {
  if (deliveryType === 'pickup') {
    const list: Array<{ value: OrderStatus; label: string }> = [
      { value: 'pending', label: 'Pending' },
    ];
    if (hasPerKilo) {
      list.push(
        { value: 'awaiting_weighing', label: 'Awaiting Weighing' },
        { value: 'price_confirmed', label: 'Price Confirmed' }
      );
    }
    list.push(
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'processing', label: 'Processing' },
      { value: 'ready', label: 'Ready for Pickup' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    );
    return list;
  } else {
    // Delivery (Cash on Delivery)
    const list: Array<{ value: OrderStatus; label: string }> = [
      { value: 'pending', label: 'Pending' },
      { value: 'awaiting_weighing', label: 'Awaiting Weighing' },
      { value: 'price_confirmed', label: 'Price Confirmed' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'processing', label: 'Processing' },
      { value: 'ready_for_delivery', label: 'Ready for Delivery' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
    if (currentStatus && ['claimed', 'out_for_delivery'].includes(currentStatus)) {
      list.push({
        value: currentStatus,
        label: ORDER_STATUS_LABELS[currentStatus],
      });
    }
    return list;
  }
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awaiting_weighing: 'bg-cyan-100 text-cyan-800',
  price_confirmed: 'bg-teal-100 text-teal-800',
  confirmed: 'bg-orange-100 text-orange-800',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-purple-100 text-purple-800',
  ready_for_delivery: 'bg-purple-100 text-purple-800',
  claimed: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_pickup: 'Cash on Pickup',
  cash_on_delivery: 'Cash on Delivery',
};
