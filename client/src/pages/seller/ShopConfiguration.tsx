import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

const ShopConfiguration: React.FC = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    address: '',
    contactPerson: '',
    phone: '',
    permit: null as File | null,
    permitIssueDate: '',
  });

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const res = await api.get('/seller/farm');
        const farm = res.data.farm;
        setForm({
          businessName: farm.name || '',
          address: farm.location || '',
          contactPerson: user?.fullname || '',
          phone: user?.phone || '',
          permit: null,
          permitIssueDate: farm.permit_issue_date || '',
        });
      } catch (err) {
        console.error('Failed to load farm details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFarm();
  }, [user]);

  const handleChange = (field: string, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('name', form.businessName);
      formData.append('location', form.address);
      formData.append('description', 'Farm shop configuration details.');
      formData.append('permit_issue_date', form.permitIssueDate);
      if (form.permit) {
        formData.append('permit', form.permit);
      }

      const res = await api.post('/seller/farm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.user) {
        setUser(res.data.user);
      }

      setSuccess('Shop configuration saved successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save shop info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2"></span>
          Loading shop settings...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Shop configuration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Business information</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Keep your shop details current and upload your LGU permit for verification.</p>
      </div>

      <form onSubmit={submit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">{success}</p>
          </div>
        )}

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
              className="w-full rounded-2xl border border-slate-200 bg-slate-200 px-4 py-3 outline-none cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
            <input
              value={form.phone}
              className="w-full rounded-2xl border border-slate-200 bg-slate-200 px-4 py-3 outline-none cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Date Issued (LGU Permit)</label>
            <input
              type="date"
              value={form.permitIssueDate}
              onChange={(e) => handleChange('permitIssueDate', e.target.value)}
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
            <p className="mt-2 text-sm text-slate-500">Upload your current LGU permit for compliance review. Uploading a new permit will reset verification status.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save shop info'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default ShopConfiguration;
