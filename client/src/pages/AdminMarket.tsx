import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import SearchIcon from '../components/common/SearchIcon';

interface ProductItem {
  id: number;
  name: string;
  category?: string;
  description?: string;
  image?: string;
  price: number;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  price_jumbo?: number;
  stock: number;
  is_active: boolean;
  is_flagged: boolean;
  farm_origin?: string;
  rating?: number;
}

interface FarmInfo {
  id: number;
  name: string;
  location?: string;
  description?: string;
  permit_status: string;
  permit_issue_date?: string;
  permit_expiry_date?: string;
  is_permit_expired?: boolean;
  rating?: number;
}

interface SellerItem {
  id: number;
  fullname: string;
  business_name?: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  display_status: 'Verified' | 'Pending' | 'Suspended';
  created_at?: string;
  farm: FarmInfo | null;
  total_revenue: number;
  total_transactions: number;
  completed_transactions: number;
  pending_transactions: number;
  cancelled_transactions: number;
  products_count: number;
  products: ProductItem[];
}

interface MarketStats {
  total_sellers: number;
  verified_sellers: number;
  total_transactions: number;
  total_revenue: number;
}

const AdminMarket: React.FC = () => {
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [stats, setStats] = useState<MarketStats>({
    total_sellers: 0,
    verified_sellers: 0,
    total_transactions: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerItem | null>(null);
  const [flaggingProductId, setFlaggingProductId] = useState<number | null>(null);

  useEffect(() => {
    fetchMarketSellers();
  }, []);

  const fetchMarketSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/market/sellers');
      if (res.data) {
        setSellers(res.data.sellers || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch market sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductFlag = async (productId: number) => {
    try {
      setFlaggingProductId(productId);
      const res = await api.put(`/admin/products/${productId}/toggle-flag`);
      const updatedFlag = res.data.product?.is_flagged;

      // Update in selectedSeller
      if (selectedSeller) {
        setSelectedSeller((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            products: prev.products.map((p) =>
              p.id === productId ? { ...p, is_flagged: updatedFlag } : p
            ),
          };
        });
      }

      // Update in sellers list
      setSellers((prev) =>
        prev.map((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === productId ? { ...p, is_flagged: updatedFlag } : p
          ),
        }))
      );
    } catch (err) {
      console.error('Failed to toggle product flag:', err);
    } finally {
      setFlaggingProductId(null);
    }
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'pending':
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'suspended':
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const handleExport = () => {
    if (sellers.length === 0) return;
    const headers = ['Seller ID', 'Full Name', 'Farm Name', 'Email', 'Phone', 'Status', 'Products Listed', 'Total Transactions', 'Total Revenue (PHP)'];
    const rows = sellers.map((s) => [
      s.id,
      `"${s.fullname.replace(/"/g, '""')}"`,
      `"${(s.farm?.name || 'N/A').replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"${s.phone || 'N/A'}"`,
      s.display_status,
      s.products_count,
      s.total_transactions,
      s.total_revenue,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registered_sellers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesStatus =
      filterStatus === 'all' ||
      seller.display_status.toLowerCase() === filterStatus.toLowerCase();

    if (!matchesStatus) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = seller.fullname.toLowerCase().includes(term);
    const matchesUsername = seller.username.toLowerCase().includes(term);
    const matchesEmail = seller.email.toLowerCase().includes(term);
    const matchesFarm = seller.farm?.name?.toLowerCase().includes(term);
    const matchesLocation = seller.farm?.location?.toLowerCase().includes(term);

    return matchesName || matchesUsername || matchesEmail || matchesFarm || matchesLocation;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-100 font-semibold">Market Monitoring</p>
          <h1 className="mt-2 text-3xl font-semibold">Registered Sellers & Marketplace Health</h1>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Registered Sellers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total_sellers.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">Total farm operators</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Verified Sellers</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.verified_sellers.toLocaleString()}</p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              {stats.total_sellers > 0 ? Math.round((stats.verified_sellers / stats.total_sellers) * 100) : 0}% compliance rate
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Transactions</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.total_transactions.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">All customer orders</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Marketplace Sales</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{formatPHP(stats.total_revenue)}</p>
            <p className="mt-1 text-xs text-slate-400">Completed volume</p>
          </div>
        </div>

        {/* Sellers Directory Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Seller directory & operations</p>
              <h2 className="text-2xl font-semibold text-slate-900">Registered Sellers</h2>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex items-center min-w-[240px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search sellers, farms, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleExport}
                className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter Status Pills */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {(['all', 'verified', 'pending', 'suspended'] as const).map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setFilterStatus(statusKey)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === statusKey
                    ? 'bg-emerald-950 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
              </button>
            ))}
          </div>

          {/* Sellers Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <span className="w-5 h-5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>
                      Loading registered sellers...
                    </td>
                  </tr>
                ) : filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      No sellers found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr
                      key={seller.id}
                      onClick={() => setSelectedSeller(seller)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                            {seller.fullname}
                          </p>
                          {seller.farm?.name && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {seller.farm.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block rounded-2xl px-3 py-1 text-xs font-semibold ${getStatusBadge(seller.display_status)}`}>
                          {seller.display_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">
                        <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs">
                          {seller.products_count} {seller.products_count === 1 ? 'product' : 'products'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-700">
                        {formatPHP(seller.total_revenue)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeller(seller);
                          }}
                          className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Seller Modal */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedSeller.farm?.name || selectedSeller.fullname}
                    </h3>
                    <span className={`inline-block rounded-2xl px-3 py-0.5 text-xs font-semibold ${getStatusBadge(selectedSeller.display_status)}`}>
                      {selectedSeller.display_status}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-slate-600">
                      {selectedSeller.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Operated by <span className="font-semibold text-slate-800">{selectedSeller.fullname}</span> (@{selectedSeller.username})
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSeller(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              {/* Highlight Metrics: Revenue & Transactions */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-xs uppercase font-semibold text-emerald-800">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">
                    {formatPHP(selectedSeller.total_revenue)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">Completed order earnings</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs uppercase font-semibold text-blue-800">Total Transactions</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">
                    {selectedSeller.total_transactions}
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    {selectedSeller.completed_transactions} completed • {selectedSeller.pending_transactions} pending
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <p className="text-xs uppercase font-semibold text-purple-800">Products Listed</p>
                  <p className="mt-2 text-2xl font-bold text-purple-900">
                    {selectedSeller.products_count}
                  </p>
                  <p className="mt-1 text-xs text-purple-700">Inventory count</p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-xs uppercase font-semibold text-amber-800">Permit Status</p>
                  <p className="mt-2 text-xl font-bold text-amber-900 capitalize">
                    {selectedSeller.farm?.permit_status || 'Unregistered'}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    {selectedSeller.farm?.is_permit_expired ? 'Expired License' : 'Regulatory status'}
                  </p>
                </div>
              </div>

              {/* Seller Information Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Seller & Farm Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.fullname}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Phone Number</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.phone || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Farm / Business Name</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.farm?.name || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Farm Location</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.farm?.location || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Registered On</span>
                    <span className="font-semibold text-slate-900">{selectedSeller.created_at || 'N/A'}</span>
                  </div>
                </div>
                {selectedSeller.farm?.description && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">About Farm: </span>
                    {selectedSeller.farm.description}
                  </div>
                )}
              </div>

              {/* Their Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">
                    Their Products ({selectedSeller.products.length})
                  </h4>
                  <span className="text-xs text-slate-500">
                    Live inventory listings managed by this seller
                  </span>
                </div>

                {selectedSeller.products.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No products listed</p>
                    <p className="text-xs text-slate-400 mt-1">This seller has not uploaded any product listings yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Stock</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Moderation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSeller.products.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-400">
                                    Item
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900">{product.name}</p>
                                  {product.farm_origin && (
                                    <p className="text-xs text-slate-400">{product.farm_origin}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 capitalize text-slate-600">
                              {product.category || 'General'}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-800">
                              {formatPHP(product.price)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block rounded-xl px-2.5 py-0.5 text-xs font-semibold ${
                                product.stock <= 5
                                  ? 'bg-rose-100 text-rose-800'
                                  : product.stock <= 10
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {product.stock} in stock
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block rounded-xl px-2.5 py-0.5 text-xs font-semibold ${
                                product.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {product.is_flagged && (
                                <span className="ml-1.5 inline-block rounded-xl bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
                                  Flagged
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleProductFlag(product.id)}
                                disabled={flaggingProductId === product.id}
                                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                                  product.is_flagged
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {flaggingProductId === product.id
                                  ? 'Saving...'
                                  : product.is_flagged
                                  ? 'Unflag'
                                  : 'Flag'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  Done
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
