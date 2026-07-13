import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import ProductCard from '../../components/customer/ProductCard';
import type { Product } from '../../types/marketplace';

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/products', { params: search ? { search } : {} });
        setProducts(res.data.products ?? []);
      } catch {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-customer-dark to-green-700 text-white shadow-card">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium">
              Capiz Poultry Marketplace
            </span>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              Fresh Poultry,<br />
              <span className="text-brand-light">Straight from the Farm</span>
            </h1>
            <p className="max-w-md text-green-100">
              Browse trusted local farms, check product origins, and order fresh chicken and eggs with pickup or delivery.
            </p>
          </div>
          <div className="relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&h=500&fit=crop"
              alt="Fresh poultry"
              className="rounded-2xl object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-500">
              {search ? `Results for "${search}"` : 'Top picks from verified local farms'}
            </p>
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-red-600">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-card">
            No products found. Try a different search.
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
