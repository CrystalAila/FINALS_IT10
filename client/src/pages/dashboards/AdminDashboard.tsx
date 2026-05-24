import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

const AdminDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="page-heading">
        <div>
          <div className="status-pill danger">Admin Oversight</div>
          <h2>Admin Console</h2>
          <p>Seller verification, analytics, and activity logs in a refined control center.</p>
        </div>
      </div>

      <section className="dashboard-grid">
        <article className="card">
          <h3 className="card-title">Seller Verification Queue</h3>
          <p className="card-copy">Review pending reseller applications, approvals, and compliance checks.</p>
        </article>

        <article className="card">
          <h3 className="card-title">Analytics</h3>
          <p className="card-copy">Monitor sales, orders, and active marketplace trends with a clear view.</p>
        </article>

        <article className="card">
          <h3 className="card-title">Logs Viewer</h3>
          <p className="card-copy">View user activities, system events, and audit trails in one place.</p>
          <Link to="/admin/logs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Open Activity Logs
          </Link>
        </article>

        <article className="card">
          <h3 className="card-title">User Management</h3>
          <p className="card-copy">Administrate customers, resellers, and admin accounts from one secure dashboard.</p>
          <Link to="/admin/users" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Open User Management
          </Link>
        </article>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
