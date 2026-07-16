import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';

const CATEGORIES = [
  { value: 'broiler', label: 'Broiler Chicken' },
  { value: 'native', label: 'Native / Free-range Chicken' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'dressed_chicken', label: 'Dressed Chicken' },
];

const CreateProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'broiler',
    farm_origin: '',
    price_small: '',
    price_medium: '',
    price_large: '',
    price_jumbo: '',
    stock_small: '',
    stock_medium: '',
    stock_large: '',
    stock_jumbo: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await api.get('/seller/products');
          const products = res.data.products;
          const product = products.find((p: any) => p.id === Number(id));
          if (product) {
            setForm({
              name: product.name || '',
              description: product.description || '',
              category: product.category || 'broiler',
              farm_origin: product.farm_origin || '',
              price_small: String(product.price_small ?? ''),
              price_medium: String(product.price_medium ?? ''),
              price_large: String(product.price_large ?? ''),
              price_jumbo: String(product.price_jumbo ?? ''),
              stock_small: String(product.stock_small ?? 0),
              stock_medium: String(product.stock_medium ?? 0),
              stock_large: String(product.stock_large ?? 0),
              stock_jumbo: String(product.stock_jumbo ?? 0),
            });
            if (product.image) {
              setImagePreview(product.image);
            }
          } else {
            setError('Product not found in your listings.');
          }
        } catch (err) {
          console.error('Failed to load product:', err);
          setError('Failed to load product details for editing.');
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      form.price_small === '' ||
      form.price_medium === '' ||
      form.price_large === '' ||
      form.price_jumbo === '' ||
      form.stock_small === '' ||
      form.stock_medium === '' ||
      form.stock_large === '' ||
      form.stock_jumbo === ''
    ) {
      setError('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('farm_origin', form.farm_origin.trim());
      
      formData.append('price_small', form.price_small);
      formData.append('price_medium', form.price_medium);
      formData.append('price_large', form.price_large);
      formData.append('price_jumbo', form.price_jumbo);

      formData.append('stock_small', form.stock_small);
      formData.append('stock_medium', form.stock_medium);
      formData.append('stock_large', form.stock_large);
      formData.append('stock_jumbo', form.stock_jumbo);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        formData.append('_method', 'PUT');
        await api.post(`/seller/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/seller/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/seller/listings');
    } catch (err: any) {
      const firstError =
        err?.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat()[0]
          : null;
      setError(firstError ?? err?.response?.data?.message ?? 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2"></span>
          Loading listing details...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
          {isEdit ? 'Edit listing' : 'Create product'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {isEdit ? 'Modify your listing' : 'Add a new listing'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {isEdit
            ? 'Update the product details, stock, pricing by size, and origin for this listing.'
            : 'Enter the product details to add it to your seller catalog.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Name */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Product name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Fresh Broiler Chicken"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Farm Origin / Source Location */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Source Location / Farm Origin <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              value={form.farm_origin}
              onChange={(e) => handleChange('farm_origin', e.target.value)}
              placeholder="e.g. Tapaz Poultry Farm, Capiz (Leave blank to use shop location)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Price & Stock Grid by Size */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-md font-semibold text-slate-800 border-b border-slate-100 pb-2">
              Pricing and Inventory by Size <span className="text-red-500">*</span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Small */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Small Size</p>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_small}
                    onChange={(e) => handleChange('price_small', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_small}
                    onChange={(e) => handleChange('stock_small', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Medium Size</p>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_medium}
                    onChange={(e) => handleChange('price_medium', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_medium}
                    onChange={(e) => handleChange('stock_medium', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              {/* Large */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Large Size</p>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_large}
                    onChange={(e) => handleChange('price_large', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_large}
                    onChange={(e) => handleChange('stock_large', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              {/* Jumbo */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Jumbo Size</p>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_jumbo}
                    onChange={(e) => handleChange('price_jumbo', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 font-semibold">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_jumbo}
                    onChange={(e) => handleChange('stock_jumbo', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              placeholder="Describe your product — breed, feeding practices, weight range, etc."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>

          {/* Product Image */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Product photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Optional — a default image will be used if none is uploaded.</p>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product preview"
                className="mt-3 h-48 w-full rounded-2xl object-cover border border-slate-200"
              />
            )}
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
            disabled={saving}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving product...' : isEdit ? 'Update product' : 'Save product'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default CreateProduct;
