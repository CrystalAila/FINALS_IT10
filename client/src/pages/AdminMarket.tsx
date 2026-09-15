import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';

interface Product {
  id: number;
  name: string;
  seller: string;
  farm_origin: string;
  verification_status: 'Verified' | 'Pending' | 'Flagged';
  status: 'Active' | 'Inactive' | 'Suspended';
  price: number;
  image?: string;
  category?: string;
  stock?: number;
  is_flagged?: boolean;
}

interface MarketStats {
  live_listings: number;
  active_sellers: number;
  orders_today: number;
}

const AdminMarket: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<MarketStats>({
    live_listings: 0,
    active_sellers: 0,
    orders_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'flagged'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products', {
        params: { status: filterStatus === 'all' ? undefined : filterStatus },
      });
      if (response.data.products) {
        setProducts(response.data.products);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (productId: number) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/products/${productId}/toggle-flag`);
      await fetchProducts();
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct((prev) =>
          prev
            ? {
                ...prev,
                is_flagged: !prev.is_flagged,
                verification_status: prev.is_flagged ? 'Verified' : 'Flagged',
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle product flag:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Product', 'Seller', 'Farm Origin', 'Verification', 'Status', 'Price (PHP)'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.seller.replace(/"/g, '""')}"`,
      `"${p.farm_origin.replace(/"/g, '""')}"`,
      p.verification_status,
      p.status,
      p.price,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketplace_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600';
      case 'Inactive':
        return 'text-slate-600';
      case 'Suspended':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.seller.toLowerCase().includes(term) ||
      p.farm_origin.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Market Monitoring</p>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace activity overview</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Track seller listings, live order volume, and marketplace health across the Poultry Link network.
          </p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Live listings', value: stats.live_listings.toLocaleString(), icon: '📦', color: 'text-emerald-900' },
            { label: 'Active sellers', value: stats.active_sellers.toLocaleString(), icon: '🏢', color: 'text-blue-900' },
            { label: 'Orders today', value: stats.orders_today.toLocaleString(), icon: '💳', color: 'text-amber-900' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${item.color} flex items-center gap-2`}>
                <span className="text-3xl">{item.icon}</span>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Products on marketplace</p>
              <h2 className="text-2xl font-semibold text-slate-900">Active listings</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
              <button
                onClick={handleExport}
                className="rounded-2xl bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Export
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {(['all', 'active', 'inactive', 'flagged'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === f
                    ? 'bg-emerald-950 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Seller</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Farm Origin</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Verification</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <span className="w-5 h-5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>
                      Loading marketplace listings...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No product listings found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{product.seller}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{product.farm_origin}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block rounded-2xl px-3 py-1 text-xs font-semibold ${getVerificationColor(product.verification_status)}`}>
                          {product.verification_status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${getStatusColor(product.status)}`}>
                        {product.status}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                        ₱{Number(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Review →
                          </button>
                          <button
                            onClick={() => handleToggleFlag(product.id)}
                            disabled={actionLoading}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition ${
                              product.verification_status === 'Flagged'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {product.verification_status === 'Flagged' ? 'Unflag' : 'Flag'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Product Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xl font-bold text-slate-900">Product Review</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {selectedProduct.image && (
                <div className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Product Name:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Seller / Farm:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.seller}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Farm Origin:</span>
                  <span className="text-slate-700">{selectedProduct.farm_origin}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold capitalize text-slate-800">{selectedProduct.category || 'General'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Price:</span>
                  <span className="font-bold text-emerald-800">
                    ₱{Number(selectedProduct.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Stock:</span>
                  <span className="font-semibold text-slate-800">{selectedProduct.stock ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Listing Status:</span>
                  <span className={`font-semibold ${getStatusColor(selectedProduct.status)}`}>
                    {selectedProduct.status}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Verification Status:</span>
                  <span className={`inline-block rounded-2xl px-2.5 py-0.5 text-xs font-semibold ${getVerificationColor(selectedProduct.verification_status)}`}>
                    {selectedProduct.verification_status}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleToggleFlag(selectedProduct.id)}
                  disabled={actionLoading}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                    selectedProduct.verification_status === 'Flagged'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  {selectedProduct.verification_status === 'Flagged' ? 'Unflag Listing' : 'Flag Listing'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMarket;
