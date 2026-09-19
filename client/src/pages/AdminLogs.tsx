import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import SearchIcon from '../components/common/SearchIcon';

type LogEntry = {
  id: number;
  activity: string;
  created_at: string;
  user: {
    id: number;
    fullname: string;
    username: string;
  } | null;
};

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = async (pageNumber = 1, query = '') => {
    setLoading(true);
    try {
      const response = await api.get('/admin/logs', {
        params: { search: query, page: pageNumber },
      });
      setLogs(response.data.data);
      setHasMore(response.data.next_page_url !== null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search);
  }, [page, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-100 font-semibold">Audit Logs</p>
          <h1 className="mt-2 text-3xl font-semibold">System Activity Trail</h1>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-slate-500">Recent activity</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">Audit Trail</h3>
            </div>
            <div className="relative flex items-center min-w-[240px] max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                placeholder="Search logs by user or activity"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280', fontWeight: 600 }}>User</th>
                  <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280', fontWeight: 600 }}>Activity</th>
                  <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280', fontWeight: 600 }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem 0' }}>
                      <span className="font-medium text-slate-900">
                        {log.user ? `${log.user.fullname} (${log.user.username})` : 'System'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0' }} className="text-slate-700">{log.activity}</td>
                    <td style={{ padding: '1rem 0', color: '#6b7280' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '1rem 0', color: '#6b7280', textAlign: 'center' }}>
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ color: '#6b7280' }}>{loading ? 'Loading logs…' : `${logs.length} records`}</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                type="button"
                disabled={!hasMore}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
