import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import Modal from '../../components/customer/Modal';
import type { SavedAddress } from '../../types/marketplace';

const emptyForm = {
  full_name: '',
  phone: '',
  region: '',
  postal_code: '',
  street_address: '',
  is_default: false,
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAddresses = () => {
    setLoading(true);
    api
      .get('/addresses')
      .then((res) => setAddresses(res.data.addresses))
      .catch(() => setError('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, is_default: addresses.length === 0 });
    setModalOpen(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      region: addr.region,
      postal_code: addr.postal_code,
      street_address: addr.street_address,
      is_default: addr.is_default,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, form);
      } else {
        await api.post('/addresses', form);
      }
      setModalOpen(false);
      loadAddresses();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      loadAddresses();
    } catch {
      setError('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.post(`/addresses/${id}/default`);
      loadAddresses();
    } catch {
      setError('Failed to set default address');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
          <p className="text-sm text-gray-500">Manage your delivery addresses</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-center text-gray-500">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-card">
          <MapPin className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No saved addresses yet.</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 text-brand hover:underline"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className={`rounded-2xl bg-white p-5 shadow-card ${addr.is_default ? 'ring-2 ring-brand/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{addr.full_name}</p>
                      {addr.is_default && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    <p className="text-sm text-gray-600">
                      {addr.street_address}, {addr.region} {addr.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      title="Set as default"
                      className="rounded-lg p-2 text-gray-400 hover:bg-brand/10 hover:text-brand"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(addr)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Address' : 'New Address'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
            <input
              required
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              required
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Street Address</label>
            <textarea
              required
              rows={2}
              value={form.street_address}
              onChange={(e) => setForm({ ...form, street_address: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded border-gray-300 text-brand focus:ring-brand"
            />
            Set as default address
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
