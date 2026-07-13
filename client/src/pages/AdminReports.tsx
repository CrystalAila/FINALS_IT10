import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verification' | 'sales' | 'performance'>('verification');

  const reportTypes = [
    {
      id: 'verification',
      title: 'Verification Progress',
      description: 'Track permit approvals and pending seller applications.',
      icon: '✓',
      metrics: [
        { label: 'Total Applications', value: 156 },
        { label: 'Approved', value: 142 },
        { label: 'Pending', value: 12 },
        { label: 'Rejected', value: 2 },
      ],
    },
    {
      id: 'sales',
      title: 'Sales Trends',
      description: 'Review marketplace volume, best-selling items, and demand hotspots.',
      icon: '📈',
      metrics: [
        { label: 'Total Transactions', value: 8947 },
        { label: 'Revenue (KES)', value: '145.2M' },
        { label: 'Avg Order Value', value: 'KES 8,450' },
        { label: 'Top Product', value: 'Layer Feed' },
      ],
    },
    {
      id: 'performance',
      title: 'System Performance',
      description: 'Monitor system health, uptime, and operational metrics.',
      icon: '⚙️',
      metrics: [
        { label: 'Uptime', value: '99.8%' },
        { label: 'Response Time', value: '245ms' },
        { label: 'Active Users', value: 2043 },
        { label: 'API Calls', value: '156K' },
      ],
    },
  ];

  const activeReport = reportTypes.find((r) => r.id === activeTab);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Reports</p>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace and compliance reports</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Generate weekly reports on seller activity, verification progress, and operational performance.
          </p>
        </div>

        {/* Report Tabs */}
        <div className="flex gap-2 flex-wrap">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveTab(report.id as any)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === report.id
                  ? 'bg-emerald-950 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{report.icon}</span>
              {report.title}
            </button>
          ))}
        </div>

        {/* Active Report */}
        {activeReport && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{activeReport.title}</h2>
                  <p className="mt-2 text-slate-600">{activeReport.description}</p>
                </div>
                <button className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900">
                  📥 Export Report
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {activeReport.metrics.map((metric, idx) => (
                  <div key={idx} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Trend Analysis (Last 30 days)</h3>
              <div className="rounded-2xl bg-slate-50 p-8 text-center">
                <p className="text-slate-500">📊 Chart visualization would be displayed here</p>
                <p className="mt-2 text-sm text-slate-400">Integration with charting library (e.g., Chart.js, Recharts) recommended</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
