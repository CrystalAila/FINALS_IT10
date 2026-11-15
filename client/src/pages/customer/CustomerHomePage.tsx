import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import ProductCard from '../../components/customer/ProductCard';
import StoresNearMe from '../../components/customer/StoresNearMe';
import type { Product } from '../../types/marketplace';
import { SearchIcon } from '../../components/common/SearchIcon';
import heroPoultryImg from '../../assets/hero-poultry.jpg';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import { calculateDistanceKm } from '../../lib/geo';
import { ShoppingBag, Store, MapPin } from 'lucide-react';

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab & View States
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [sortByNearest, setSortByNearest] = useState(false);
  const { location: customerLocation } = useCustomerLocation();

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

  // Sort products by distance if sortByNearest is enabled and customer location is available
  const displayedProducts = [...products].sort((a, b) => {
    if (sortByNearest && customerLocation) {
      const distA =
        a.farm?.latitude && a.farm?.longitude
          ? calculateDistanceKm(
              customerLocation.latitude,
              customerLocation.longitude,
              Number(a.farm.latitude),
              Number(a.farm.longitude)
            )
          : Infinity;
      const distB =
        b.farm?.latitude && b.farm?.longitude
          ? calculateDistanceKm(
              customerLocation.latitude,
              customerLocation.longitude,
              Number(b.farm.latitude),
              Number(b.farm.longitude)
            )
          : Infinity;
      return distA - distB;
    }
    return 0;
  });

  return (
    <div className="w-full">
      {/* Hero Banner - Stretches full width across the entire sides of the screen */}
      <section className="relative overflow-hidden w-full text-white min-h-[380px] sm:min-h-[440px] flex items-center shadow-md">
        {/* Full-width Chicken Background Photo */}
        <img
          src={heroPoultryImg}
          alt="Fresh poultry chickens on the farm"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Semi-transparent Green Overlay (50% opacity, sitting above image and below text to tint the chicken photo) */}
        <div
          className="absolute inset-0 bg-green-900/50"
          style={{ backgroundColor: 'rgba(22, 101, 52, 0.5)' }}
        />

        {/* Content on top of overlay aligned with site container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
          <div className="max-w-2xl space-y-5 lg:space-y-6">
            <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm shadow-sm tracking-wide border border-white/10">
              Capiz Poultry Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-md">
              Fresh Poultry,<br />
              <span className="text-[#E27638]">Straight from the Farm</span>
            </h1>
            <p className="max-w-md text-sm sm:text-base text-white/95 leading-relaxed font-normal drop-shadow-sm">
              Browse trusted local farms, check product origins, and order fresh chicken and eggs with pickup or delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* View Switcher: Products Catalog vs Store Finder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Products Catalog
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stores')}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-[#D96B27] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Store className="h-4 w-4" />
              Stores Near Me
            </button>
          </div>

          {activeTab === 'products' && customerLocation && (
            <button
              type="button"
              onClick={() => setSortByNearest(!sortByNearest)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition border cursor-pointer ${
                sortByNearest
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {sortByNearest ? 'Sorted: Nearest to You' : 'Sort: Nearest to You'}
            </button>
          )}
        </div>

        {activeTab === 'stores' ? (
          <StoresNearMe />
        ) : (
          <>
            {/* Filter panel */}
            <section className="sticky top-[64px] z-20 bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search bar */}
                <div className="flex-1 flex gap-2 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
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
                    Favorited Shops
                  </button>

                  {/* Clear Filters */}
                  {(searchInput || category || size || farmOrigin || favoritesOnly || sortByNearest) && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFilters();
                        setSortByNearest(false);
                      }}
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
                    <option value="live_poultry">Live Poultry</option>
                    <option value="dressed_meat">Dressed Meat</option>
                    <option value="eggs">Eggs</option>
                    <option value="broiler">Broiler Chicken</option>
                    <option value="native">Native Chicken</option>
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
                  <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                  <p className="text-gray-500">
                    {favoritesOnly
                      ? 'Showing listings from your favorited shops'
                      : sortByNearest && customerLocation
                      ? 'Arranged with nearest farms and raisers to your location first'
                      : 'Fresh chicken, native birds, and farm eggs from local Capiz raisers'}
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

              {!loading && !error && displayedProducts.length === 0 && (
                <div className="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-card">
                  No products found matching your current filter criteria.
                </div>
              )}

              {!loading && displayedProducts.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
