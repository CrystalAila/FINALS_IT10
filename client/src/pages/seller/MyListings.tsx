import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

const listings = [
  { id: 1, name: 'Fresh Broiler Chicken', stock: 24, price: '₱180/kg', status: 'Active' },
  { id: 2, name: 'Free-range Eggs', stock: 9, price: '₱14/pc', status: 'Low stock' },
  { id: 3, name: 'Organic Duck Meat', stock: 16, price: '₱220/kg', status: 'Active' },
];

const MyListings: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">My listings</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your products</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Update stock, prices, and availability for the farm goods you sell.</p>
        </div>
        <Link
          to="/seller/listings/new"
          className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          Create New Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        <div className="grid gap-4 border-b border-slate-200 px-6 py-5 text-sm font-semibold text-slate-500 sm:grid-cols-[3fr_1fr_1fr_1fr]">
          <div>Product</div>
          <div className="hidden sm:block">Price</div>
          <div className="text-right">Stock</div>
          <div className="text-right">Status</div>
        </div>

        <div className="divide-y divide-slate-200">
          {listings.map((item) => (
            <div key={item.id} className="grid gap-4 px-6 py-5 text-sm sm:grid-cols-[3fr_1fr_1fr_1fr] sm:items-center">
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">Managed by your farm shop</p>
              </div>
              <div className="hidden sm:block text-slate-700">{item.price}</div>
              <div className="text-right font-semibold text-slate-900">{item.stock}</div>
              <div className="text-right">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-700'}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MyListings;
