import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

const units = ['kg', 'piece', 'crate'];

const CreateProduct: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    unit: 'kg',
    farmOrigin: '',
    images: [] as File[],
  });
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setForm((prev) => ({ ...prev, images: Array.from(files) }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate('/seller/listings');
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Create product</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Add a new listing</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Enter the product details to add it to your seller catalog.</p>
      </div>

      <form onSubmit={submit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Product name</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {units.map((unitName) => (
                <option value={unitName} key={unitName}>{unitName}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Farm origin</label>
            <input
              value={form.farmOrigin}
              onChange={(e) => handleChange('farmOrigin', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Product images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:outline-none"
            />
            <p className="mt-2 text-sm text-slate-500">Upload up to 5 images for the product listing.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/seller/listings')}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            Save product
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default CreateProduct;
