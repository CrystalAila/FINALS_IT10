import Layout from '../../components/Layout';

const ResellerDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="page-heading">
        <div>
          <div className="status-pill warning">Reseller Operations</div>
          <h2>Reseller Console</h2>
          <p>Manage stock, biological inventory, and weights in a polished dashboard.</p>
        </div>
      </div>

      <section className="dashboard-grid">
        <article className="card">
          <h3 className="card-title">Stock Overview</h3>
          <p className="card-copy">Review current birds, feedstock, and production availability at a glance.</p>
        </article>

        <article className="card">
          <h3 className="card-title">Biological Inventory</h3>
          <p className="card-copy">Track age, vaccination status, and inventory health metrics.</p>
        </article>

        <article className="card">
          <h3 className="card-title">Catch-Weight Tool</h3>
          <p className="card-copy">Record variable-priced yields with confidence using a cleaner workflow.</p>
        </article>
      </section>
    </Layout>
  );
};

export default ResellerDashboard;
