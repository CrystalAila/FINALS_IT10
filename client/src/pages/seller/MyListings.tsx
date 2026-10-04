import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import type { Product } from '../../types/marketplace';
import { formatPrice, formatUnitSuffix, priceRange, resolveProductImage } from '../../types/marketplace';
import { SearchIcon } from '../../components/common/SearchIcon';

const MyListings: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.products);
    } catch (err: any) {
      setError('Failed to fetch product listings.');
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/seller/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success(`"${name}" deleted successfully.`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to delete product.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.farm_origin && p.farm_origin.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'live_poultry':
        return 'Live Poultry';
      case 'dressed_meat':
        return 'Dressed Meat';
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link
          to="/seller/listings/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition"
        >
          Add Product
        </Link>
      </div>

      {/* Real-time search bar */}
      <div className="mb-6 flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, category, origin..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
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
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <p className="text-slate-500">No products match your search.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm font-semibold text-brand hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-4 text-center w-16">Image</th>
                  <th className="py-4 px-4 min-w-[200px]">Product</th>
                  <th className="py-4 px-4 min-w-[170px]">Stock</th>
                  <th className="py-4 px-4 text-right min-w-[140px]">Price</th>
                  <th className="py-4 px-4 text-center w-28">Status</th>
                  <th className="py-4 px-6 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    {/* Image */}
                    <td className="py-4 px-4 text-center">
                      <div className="mx-auto h-12 w-12 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
                        <img
                          src={resolveProductImage(item.image, item.category)}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = resolveProductImage(null, item.category);
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Product Name & Category */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        {getCategoryLabel(item.category)}
                      </p>
                      {item.farm_origin && (
                        <p className="mt-0.5 text-xs text-brand/80 font-medium">Origin: {item.farm_origin}</p>
                      )}
                    </td>

                    {/* Stock (By size for eggs, single stock for live poultry / meat) */}
                    <td className="py-4 px-4 text-xs">
                      {item.category === 'eggs' ? (
                        <div className="space-y-0.5 text-slate-500">
                          <div>Small: <strong className="text-slate-800">{item.stock_small ?? 0}</strong> | Med: <strong className="text-slate-800">{item.stock_medium ?? 0}</strong></div>
                          <div>Large: <strong className="text-slate-800">{item.stock_large ?? 0}</strong> | Jumbo: <strong className="text-slate-800">{item.stock_jumbo ?? 0}</strong></div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-bold text-slate-900">{item.stock}</span>
                          <span className="ml-1 text-xs text-slate-500 font-medium">
                            {item.unit_type === 'per_kilo' ? 'kg' : item.unit_type === 'per_head' ? 'heads' : 'units'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Price Range */}
                    <td className="py-4 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {priceRange(item)} <span className="text-xs font-normal text-slate-500">{formatUnitSuffix(item.unit_type)}</span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.stock > 0 ? 'Active' : 'Out of Stock'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/seller/listings/edit/${item.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white shadow-2xs"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id, item.name)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyListings;
