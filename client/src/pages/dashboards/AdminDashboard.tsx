import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/axios';

interface WeeklyDay {
  day: string;
  date: string;
  orders: number;
}

interface DashboardStats {
  registeredSellers: number;
  verifiedSellers: number;
  buyers: number;
  pendingPermits: number;
  adminShare: number;
  adminShareCollected?: number;
  adminShareDue?: number;
  unpaidSharesCount?: number;
  revenue?: number;
  weeklyActivity?: WeeklyDay[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    registeredSellers: 0,
    verifiedSellers: 0,
    buyers: 0,
    pendingPermits: 0,
    adminShare: 0,
    adminShareCollected: 0,
    adminShareDue: 0,
    unpaidSharesCount: 0,
    weeklyActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load real-time dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, trend, color, onClick, badge }: any) => (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${
        onClick ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md transition' : ''
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          {badge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className={`mt-2 text-3xl font-bold ${color}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {trend && <p className="mt-2 text-xs text-slate-500">{trend}</p>}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-100 font-semibold">Marketplace Overview</p>
          <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <span className="w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin mr-2"></span>
            Loading marketplace metrics...
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Registered Sellers" value={stats.registeredSellers || 0} color="text-emerald-600" />
              <StatCard label="Verified Sellers" value={stats.verifiedSellers || 0} color="text-green-600" />
              <StatCard label="Total Buyers" value={stats.buyers || 0} color="text-blue-600" />
              <StatCard label="Pending Permits" value={stats.pendingPermits || 0} color="text-amber-600" />
              <StatCard
                label="Admin Share (5%)"
                value={`₱${Number(stats.adminShare ?? stats.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                trend={
                  (stats.unpaidSharesCount ?? 0) > 0
                    ? `Due: ₱${Number(stats.adminShareDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} • Click to view`
                    : (stats.adminShareCollected ?? 0) > 0
                    ? `Collected: ₱${Number(stats.adminShareCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : '5% monthly share from all sellers'
                }
                badge={(stats.unpaidSharesCount ?? 0) > 0 ? `${stats.unpaidSharesCount} Unpaid` : undefined}
                color="text-emerald-600"
                onClick={() => navigate('/admin/shares')}
              />
            </div>

            {/* Activity Section */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Marketplace Activity</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Last 7 days</h2>
                </div>
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150"
                >
                  View Report
                </button>
              </div>

              {/* Simple Bar Chart */}
              <div className="space-y-4">
                {(stats.weeklyActivity && stats.weeklyActivity.length > 0
                  ? stats.weeklyActivity
                  : [
                      { day: 'Monday', date: '', orders: 0 },
                      { day: 'Tuesday', date: '', orders: 0 },
                      { day: 'Wednesday', date: '', orders: 0 },
                      { day: 'Thursday', date: '', orders: 0 },
                      { day: 'Friday', date: '', orders: 0 },
                      { day: 'Saturday', date: '', orders: 0 },
                      { day: 'Sunday', date: '', orders: 0 },
                    ]
                ).map((item) => {
                  const maxOrders = Math.max(
                    ...(stats.weeklyActivity?.map((w) => w.orders) || [1]),
                    1
                  );
                  const barWidth = item.orders > 0 ? Math.max((item.orders / maxOrders) * 100, 8) : 0;
                  return (
                    <div key={item.day + item.date}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">
                          {item.day} {item.date && <span className="text-xs text-slate-400 font-normal">({item.date})</span>}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.orders} {item.orders === 1 ? 'order' : 'orders'}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
