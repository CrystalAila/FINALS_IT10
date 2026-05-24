import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';

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
    <Layout>
      <div className="page-heading">
        <div>
          <div className="status-pill warning">Audit Trail</div>
          <h2>Activity Logs</h2>
          <p>Review login/logout and admin user management actions.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3 className="card-title">Recent Activity</h3>
          <input
            className="form-control"
            placeholder="Search logs by user or activity"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 320 }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280' }}>User</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280' }}>Activity</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0', color: '#6b7280' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 0' }}>
                    {log.user ? `${log.user.fullname} (${log.user.username})` : 'System'}
                  </td>
                  <td style={{ padding: '1rem 0' }}>{log.activity}</td>
                  <td style={{ padding: '1rem 0', color: '#6b7280' }}>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem 0', color: '#6b7280' }}>
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
            <button className="btn btn-secondary btn-sm" type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
              Previous
            </button>
            <button className="btn btn-secondary btn-sm" type="button" disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogs;
