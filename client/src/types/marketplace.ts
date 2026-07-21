export type ProductSize = 'small' | 'medium' | 'large' | 'jumbo';

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
};

export type Product = {
  id: number;
  farm_id: number;
  name: string;
  description?: string;
  image?: string | null;
  category: string;
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

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';

export type Rider = {
  id: number;
  farm_id: number;
  fullname: string;
  phone: string;
  photo_path?: string | null;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  size: ProductSize;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  product?: Pick<Product, 'id' | 'name' | 'image' | 'category'>;
};

export type Order = {
  id: number;
  customer_id: number;
  farm_id: number;
  status: OrderStatus;
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  total: string | number;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
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
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-orange-100 text-orange-800',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_pickup: 'Cash on Pickup',
  cash_on_delivery: 'Cash on Delivery',
};
