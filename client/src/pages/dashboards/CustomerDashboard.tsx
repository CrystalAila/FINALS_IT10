import Layout from '../../components/Layout';

const CustomerDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="page-heading">
        <div>
          <div className="status-pill success">Live Marketplace</div>
          <h2>Marketplace</h2>
          <p>Browse latest poultry listings in Capiz with market-grade clarity.</p>
        </div>
      </div>

      <section className="dashboard-grid">
        <article className="card">
          <h3 className="card-title">Featured Listings</h3>
          <p className="card-copy">Fresh eggs, broilers, and native chickens presented in a clean, modern listing view.</p>
        </article>

        <article className="card">
          <h3 className="card-title">My Orders</h3>
          <p className="card-copy">Track the latest orders, delivery progress, and order status in one place.</p>
        </article>
      </section>
    </Layout>
  );
};

export default CustomerDashboard;
