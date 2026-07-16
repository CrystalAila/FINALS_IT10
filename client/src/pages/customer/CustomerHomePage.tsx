import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import ProductCard from '../../components/customer/ProductCard';
import type { Product } from '../../types/marketplace';

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [farmOrigin, setFarmOrigin] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (searchInput.trim()) params.search = searchInput.trim();
        if (category) params.category = category;
        if (size) params.size = size;
        if (farmOrigin.trim()) params.farm_origin = farmOrigin.trim();
        if (favoritesOnly) params.favorites_only = 'true';

        const res = await api.get('/products', { params });
        setProducts(res.data.products ?? []);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce calls to avoid spamming server on type
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, category, size, farmOrigin, favoritesOnly]);

  const clearFilters = () => {
    setSearchInput('');
    setCategory('');
    setSize('');
    setFarmOrigin('');
    setFavoritesOnly(false);
  };

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

      {/* Filter panel */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 flex gap-2 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-slate-400">🔎</span>
            <input
              type="text"
              placeholder="Search products, categories, or shops..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Favorites Only toggle */}
            <button
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition flex items-center gap-2 border ${
                favoritesOnly
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>♥</span> Favorited Shops
            </button>

            {/* Clear Filters */}
            {(searchInput || category || size || farmOrigin || favoritesOnly) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All Categories</option>
              <option value="broiler">Broiler Chicken</option>
              <option value="native">Native Chicken</option>
              <option value="eggs">Eggs</option>
              <option value="dressed_chicken">Dressed Chicken</option>
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Size Availability</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All Sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="jumbo">Jumbo</option>
            </select>
          </div>

          {/* Farm Origin Filter */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Farm Origin / Source</label>
            <input
              type="text"
              placeholder="e.g. Tapaz, Roxas, Santos..."
              value={farmOrigin}
              onChange={(e) => setFarmOrigin(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Products</h2>
            <p className="text-gray-500">
              {favoritesOnly ? 'Showing listings from your favorited shops' : 'Top picks from local Capiz farms'}
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
            No products found matching your current filter criteria.
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
