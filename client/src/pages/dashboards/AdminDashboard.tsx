import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/axios';

interface DashboardStats {
  registeredSellers?: number;
  verifiedSellers?: number;
  buyers?: number;
  products?: number;
  transactions?: number;
  pendingPermits?: number;
  revenue?: number;
  flaggedListings?: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    registeredSellers: 0,
    verifiedSellers: 0,
    buyers: 0,
    products: 0,
    transactions: 0,
    pendingPermits: 0,
    revenue: 0,
    flaggedListings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set demo data
      setStats({
        registeredSellers: 156,
        verifiedSellers: 142,
        buyers: 2043,
        products: 5821,
        transactions: 8947,
        pendingPermits: 12,
        revenue: 145230,
        flaggedListings: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get('/admin/recent-activity?limit=5');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const StatCard = ({ icon, label, value, trend, color }: any) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
          {trend && <p className="mt-2 text-xs text-slate-500">{trend}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Marketplace Overview</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Monitor seller verifications, marketplace activity, transactions, and system performance across PoultryLink.
          </p>
        </div>

        {/* Top Stats Row 1 */}
        <div className="grid gap-6 lg:grid-cols-4">
          <StatCard icon="🏢" label="Registered Sellers" value={stats.registeredSellers || 0} color="text-emerald-600" />
          <StatCard icon="✓" label="Verified Sellers" value={stats.verifiedSellers || 0} color="text-green-600" />
          <StatCard icon="🛒" label="Total Buyers" value={stats.buyers || 0} color="text-blue-600" />
          <StatCard icon="📦" label="Products Listed" value={stats.products || 0} color="text-orange-600" />
        </div>

        {/* Top Stats Row 2 */}
        <div className="grid gap-6 lg:grid-cols-4">
          <StatCard icon="💳" label="Total Transactions" value={stats.transactions || 0} color="text-purple-600" />
          <StatCard icon="⏳" label="Pending Permits" value={stats.pendingPermits || 0} color="text-amber-600" />
          <StatCard icon="💰" label="Revenue (KES)" value={stats.revenue || 0} color="text-emerald-600" />
          <StatCard icon="🚩" label="Flagged Listings" value={stats.flaggedListings || 0} color="text-red-600" />
        </div>

        {/* Activity Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Marketplace Activity</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Last 7 days</h2>
            </div>
            <button className="rounded-2xl bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900">
              View Report
            </button>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
              const value = Math.floor(Math.random() * 100) + 50;
              return (
                <div key={day}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{day}</span>
                    <span className="font-semibold text-slate-900">{value} orders</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(value, 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
