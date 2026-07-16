import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import type { Product } from '../../types/marketplace';
import { formatPrice, priceRange } from '../../types/marketplace';

const MyListings: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.products);
    } catch (err: any) {
      setError('Failed to fetch product listings.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'broiler':
        return 'Broiler Chicken';
      case 'native':
        return 'Native Chicken';
      case 'eggs':
        return 'Eggs';
      case 'dressed_chicken':
        return 'Dressed Chicken';
      default:
        return cat;
    }
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">My listings</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your products</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Update stock, prices, and availability for the farm goods you sell.</p>
        </div>
        <Link
          to="/seller/listings/new"
          className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          Create New Product
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading listings...</p>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No listings found. Create one above!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="grid gap-4 border-b border-slate-200 px-6 py-5 text-sm font-semibold text-slate-500 grid-cols-2 sm:grid-cols-[0.8fr_2.5fr_2fr_1.5fr_1fr_1fr] items-center">
            <div className="hidden sm:block">Image</div>
            <div>Product</div>
            <div className="hidden sm:block">Stock by Size</div>
            <div className="hidden sm:block text-right">Price Range</div>
            <div className="text-right">Status</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-200">
            {products.map((item) => (
              <div key={item.id} className="grid gap-4 px-6 py-5 text-sm grid-cols-2 sm:grid-cols-[0.8fr_2.5fr_2fr_1.5fr_1fr_1fr] items-center">
                <div className="hidden sm:block h-12 w-12 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop'}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">{getCategoryLabel(item.category)}</p>
                  {item.farm_origin && (
                    <p className="mt-1 text-xs text-brand/80 font-medium">Origin: {item.farm_origin}</p>
                  )}
                </div>
                <div className="hidden sm:block text-xs space-y-1 text-slate-500">
                  <span className="block">Small: <strong className="text-slate-800">{item.stock_small ?? 0}</strong> | Medium: <strong className="text-slate-800">{item.stock_medium ?? 0}</strong></span>
                  <span className="block">Large: <strong className="text-slate-800">{item.stock_large ?? 0}</strong> | Jumbo: <strong className="text-slate-800">{item.stock_jumbo ?? 0}</strong></span>
                </div>
                <div className="hidden sm:block text-right font-semibold text-slate-700">
                  {priceRange(item)}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.stock > 0 ? `Active (${item.stock})` : 'Out of Stock'}
                  </span>
                </div>
                <div className="text-right">
                  <Link
                    to={`/seller/listings/edit/${item.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyListings;
