import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import api from '../../lib/axios';
import QuantitySelector from '../../components/customer/QuantitySelector';
import { useCart } from '../../context/CartContext';
import type { Product, ProductSize } from '../../types/marketplace';
import {
  SIZE_LABELS,
  displayRating,
  formatPrice,
  priceForSize,
  priceRange,
} from '../../types/marketplace';

const SIZES: ProductSize[] = ['small', 'medium', 'large', 'jumbo'];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<ProductSize>('medium');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = (redirect = false) => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image ?? null,
      farmId: product.farm_id,
      farmName: product.farm?.name ?? 'Local Farm',
      size,
      unitPrice: priceForSize(product, size),
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    if (redirect) navigate('/customer/cart');
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/60" />;
  }

  if (!product) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-card">
        <p className="text-gray-500">Product not found.</p>
        <Link to="/customer" className="mt-4 inline-block text-brand hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const currentPrice = priceForSize(product, size);
  const farmName = product.farm?.name ?? 'Local Farm';

  return (
    <div className="space-y-6">
      <Link
        to="/customer"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-card lg:grid-cols-2 lg:p-8">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={product.image ?? 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700'}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand">{product.category}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {farmName}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {displayRating(product.rating)} rating
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Price range</p>
            <p className="text-2xl font-bold text-brand">{priceRange(product)}</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              Selected: {formatPrice(currentPrice)}
            </p>
          </div>

          {/* Size options */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Size</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    size === s
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand/50'
                  }`}
                >
                  {SIZE_LABELS[s]}
                  <span className="ml-1 text-xs opacity-80">
                    ({formatPrice(priceForSize(product, s))})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Quantity</p>
            <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} />
            <p className="mt-2 text-xs text-gray-400">{product.stock} in stock</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              className="flex-1 rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
            >
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              className="flex-1 rounded-full border-2 border-brand px-6 py-3 font-bold text-brand transition hover:bg-brand/5"
            >
              Buy Now
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900">Description</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {product.description ?? 'No description available.'}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              <strong>Farm origin:</strong> {farmName}
              {product.farm?.location && ` — ${product.farm.location}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
