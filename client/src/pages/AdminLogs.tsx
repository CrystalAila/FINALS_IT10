import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import SearchIcon from '../components/common/SearchIcon';
import PrintIcon from '../components/common/PrintIcon';

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
      {/* SCREEN VIEW */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition backdrop-blur-sm cursor-pointer self-start sm:self-auto"
          >
            <PrintIcon className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Audit Trail</h3>
            </div>
            <div className="relative flex items-center min-w-[240px] max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand"
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

      {/* FORMAL PRINT REPORT LAYOUT (PLAIN WHITE, FORMAL HEADERS, NO COLOR CARDS) */}
      <div className="hidden print:block text-slate-900 bg-white font-sans text-xs p-2">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">PoultryLink Agricultural Marketplace</p>
              <h1 className="text-xl font-bold uppercase text-slate-950 mt-0.5">
                System Audit Trail & Security Logs Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                System Administration &bull; Security & Operational Audit Log Archive
                {search ? <span> &bull; Filter: "{search}"</span> : null}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900">
                Official Audit Report
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Date: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-600">
                Time: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            I. Itemized Security & System Activity Records
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-400 text-left font-semibold w-16">Log #</th>
                <th className="p-2 border border-slate-400 text-left font-semibold w-48">User Account</th>
                <th className="p-2 border border-slate-400 text-left font-semibold">Activity Description</th>
                <th className="p-2 border border-slate-400 text-left font-semibold w-36">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-slate-500 border border-slate-300">
                    No log records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-mono text-[10px]">#{log.id}</td>
                    <td className="p-2 border border-slate-300 font-semibold">
                      {log.user ? `${log.user.fullname} (${log.user.username})` : 'System Automated'}
                    </td>
                    <td className="p-2 border border-slate-300">{log.activity}</td>
                    <td className="p-2 border border-slate-300 text-slate-600 text-[10px]">
                      {new Date(log.created_at).toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Line */}
        <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-700">
          <div>
            <p className="font-semibold">Generated & Certified By:</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1">System Security Administrator</p>
          </div>
          <div>
            <p className="font-semibold">Reviewed & Verified By:</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1">Information Systems Officer</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
