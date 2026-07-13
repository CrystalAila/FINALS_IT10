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
}

const AdminMarket: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'flagged'>('all');

  useEffect(() => {
    fetchProducts();
  }, [filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products', {
        params: { status: filterStatus === 'all' ? undefined : filterStatus },
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Demo data
      setProducts([
        {
          id: 1,
          name: 'Broiler Chickens (50 birds)',
          seller: 'Farm Fresh Poultry',
          farm_origin: 'Kiambu',
          verification_status: 'Verified',
          status: 'Active',
          price: 12500,
        },
        {
          id: 2,
          name: 'Layer Feed (50kg bags)',
          seller: 'Green Valley Farms',
          farm_origin: 'Nakuru',
          verification_status: 'Verified',
          status: 'Active',
          price: 3200,
        },
        {
          id: 3,
          name: 'Organic Eggs (30 crates)',
          seller: 'Alpha Poultry Ltd',
          farm_origin: 'Nairobi',
          verification_status: 'Flagged',
          status: 'Active',
          price: 4800,
        },
      ]);
    } finally {
      setLoading(false);
    }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Market Monitoring</p>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace activity overview</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Track seller listings, live order volume, and marketplace health across the Poultry Link network.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Live listings', value: '542', icon: '📦', color: 'text-emerald-900' },
            { label: 'Active sellers', value: '87', icon: '🏢', color: 'text-blue-900' },
            { label: 'Orders today', value: '124', icon: '💳', color: 'text-amber-900' },
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
              <button className="rounded-2xl bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900">
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
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{product.name}</td>
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
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">KES {product.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarket;
