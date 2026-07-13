import { useState } from 'react';
import Layout from '../../components/Layout';

const ShopConfiguration: React.FC = () => {
  const [form, setForm] = useState({
    businessName: '',
    address: '',
    contactPerson: '',
    phone: '',
    permit: null as File | null,
  });

  const handleChange = (field: string, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Shop configuration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Business information</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Keep your shop details current and upload your LGU permit for verification.</p>
      </div>

      <form onSubmit={submit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Business name</label>
            <input
              value={form.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contact person</label>
            <input
              value={form.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Shop address</label>
            <input
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">LGU permit upload</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => handleChange('permit', e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:outline-none"
            />
            <p className="mt-2 text-sm text-slate-500">Upload your current LGU permit for compliance review.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            Save shop info
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default ShopConfiguration;
