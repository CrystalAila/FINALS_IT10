import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { resolveProductImage, getProductCategoryDefaultImage, type UnitType, UNIT_LABELS } from '../../types/marketplace';

const CATEGORIES = [
  { value: 'dressed_meat', label: 'Dressed Meat' },
  { value: 'live_poultry', label: 'Live Poultry' },
  { value: 'eggs', label: 'Eggs' },
];

const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'per_kilo', label: 'Per Kilo (kg)' },
  { value: 'per_head', label: 'Per Head' },
  { value: 'per_tray', label: 'Per Tray' },
  { value: 'per_piece', label: 'Per Piece' },
];

const getDefaultUnitForCategory = (cat: string): UnitType => {
  if (cat === 'dressed_meat' || cat === 'dressed_chicken') return 'per_kilo';
  if (cat === 'eggs') return 'per_tray';
  return 'per_head';
};

const getPriceLabel = (unit: UnitType) => {
  switch (unit) {
    case 'per_kilo':
      return 'Price per kg (₱)';
    case 'per_head':
      return 'Price per head (₱)';
    case 'per_tray':
      return 'Price per tray (₱)';
    case 'per_piece':
      return 'Price per pc (₱)';
    default:
      return 'Price (₱)';
  }
};

const CreateProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'dressed_meat',
    unit_type: 'per_kilo' as UnitType,
    increment_step: '0.50',
    farm_origin: '',
    single_price: '',
    single_stock: '',
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
            const cat = product.category || 'dressed_meat';
            const unit = (product.unit_type as UnitType) || getDefaultUnitForCategory(cat);
            const isEggs = cat === 'eggs';
            const fallbackPrice = String(product.price_medium ?? product.price_small ?? '');
            const fallbackStock = String(product.stock ?? product.stock_medium ?? 0);

            setForm({
              name: product.name || '',
              description: product.description || '',
              category: cat,
              unit_type: unit,
              increment_step: String(product.increment_step ?? (unit === 'per_kilo' ? '0.50' : '1.00')),
              farm_origin: product.farm_origin || '',
              single_price: fallbackPrice,
              single_stock: fallbackStock,
              price_small: String(product.price_small ?? (isEggs ? '' : fallbackPrice)),
              price_medium: String(product.price_medium ?? (isEggs ? '' : fallbackPrice)),
              price_large: String(product.price_large ?? (isEggs ? '' : fallbackPrice)),
              price_jumbo: String(product.price_jumbo ?? (isEggs ? '' : fallbackPrice)),
              stock_small: String(product.stock_small ?? 0),
              stock_medium: String(product.stock_medium ?? (isEggs ? 0 : fallbackStock)),
              stock_large: String(product.stock_large ?? 0),
              stock_jumbo: String(product.stock_jumbo ?? 0),
            });
            if (product.image) {
              setImagePreview(resolveProductImage(product.image, product.category));
            }
          } else {
            setError('Product not found in your listings.');
          }
        } catch (err) {
          console.error('Failed to load product:', err);
          setError('Failed to load product details for editing.');
          toast.error('Failed to load product details.');
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

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const isEggs = form.category === 'eggs';

    if (!form.name.trim()) {
      setError('Please enter a product name.');
      toast.error('Please enter a product name.');
      return;
    }

    if (isEggs) {
      if (
        form.price_small === '' ||
        form.price_medium === '' ||
        form.price_large === '' ||
        form.price_jumbo === '' ||
        form.stock_small === '' ||
        form.stock_medium === '' ||
        form.stock_large === '' ||
        form.stock_jumbo === ''
      ) {
        setError('Please fill out all size prices and stock counts for eggs.');
        toast.error('Please fill out all size prices and stock counts.');
        return;
      }
    } else {
      if (form.single_price === '' || form.single_stock === '') {
        setError('Please enter the price and available stock.');
        toast.error('Please enter the price and available stock.');
        return;
      }
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('unit_type', form.unit_type);
      formData.append('increment_step', form.increment_step || (form.unit_type === 'per_kilo' ? '0.50' : '1.00'));
      formData.append('farm_origin', form.farm_origin.trim());
      
      if (isEggs) {
        formData.append('price_small', form.price_small);
        formData.append('price_medium', form.price_medium);
        formData.append('price_large', form.price_large);
        formData.append('price_jumbo', form.price_jumbo);

        formData.append('stock_small', form.stock_small);
        formData.append('stock_medium', form.stock_medium);
        formData.append('stock_large', form.stock_large);
        formData.append('stock_jumbo', form.stock_jumbo);
      } else {
        formData.append('price', form.single_price);
        formData.append('stock', form.single_stock);

        // Populate size attributes for full database and customer display compatibility
        formData.append('price_small', form.single_price);
        formData.append('price_medium', form.single_price);
        formData.append('price_large', form.single_price);
        formData.append('price_jumbo', form.single_price);

        formData.append('stock_small', '0');
        formData.append('stock_medium', form.single_stock);
        formData.append('stock_large', '0');
        formData.append('stock_jumbo', '0');
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        formData.append('_method', 'PUT');
        await api.post(`/seller/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully.');
      } else {
        await api.post('/seller/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created successfully.');
      }

      navigate('/seller/listings');
    } catch (err: any) {
      const firstError =
        err?.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat()[0]
          : null;
      const errMsg = firstError ?? err?.response?.data?.message ?? 'Failed to save product.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    const defaultUnit = getDefaultUnitForCategory(newCat);
    setForm((prev) => ({
      ...prev,
      category: newCat,
      unit_type: defaultUnit,
      increment_step: defaultUnit === 'per_kilo' ? '0.50' : '1.00',
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2"></span>
          Loading details...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
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
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Unit */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Pricing Unit <span className="text-red-500">*</span>
            </label>
            <select
              value={form.unit_type}
              onChange={(e) => {
                const u = e.target.value as UnitType;
                setForm((prev) => ({
                  ...prev,
                  unit_type: u,
                  increment_step: u === 'per_kilo' ? '0.50' : '1.00',
                }));
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium text-slate-800"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Farm Origin */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Origin / Farm Location <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              value={form.farm_origin}
              onChange={(e) => handleChange('farm_origin', e.target.value)}
              placeholder="e.g. Roxas City, Capiz"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
            />
          </div>

          {/* Pricing & Stock: 4 sizes for Eggs, Single fields for Live Poultry and Dressed Meat */}
          {form.category === 'eggs' ? (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Pricing and Inventory by Size <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-semibold text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                  {UNIT_LABELS[form.unit_type] || 'Per Tray'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { size: 'small', label: 'Small' },
                  { size: 'medium', label: 'Medium' },
                  { size: 'large', label: 'Large' },
                  { size: 'jumbo', label: 'Jumbo' },
                ].map(({ size, label }) => (
                  <div key={size} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{label}</p>
                    <div>
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                        {getPriceLabel(form.unit_type)}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(form as any)[`price_${size}`]}
                        onChange={(e) => handleChange(`price_${size}`, e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                        required
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500">Stock (trays)</span>
                      <input
                        type="number"
                        min="0"
                        value={(form as any)[`stock_${size}`]}
                        onChange={(e) => handleChange(`stock_${size}`, e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {getPriceLabel(form.unit_type)} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-medium">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.single_price}
                    onChange={(e) => handleChange('single_price', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-semibold text-slate-900"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Pricing unit: {UNIT_LABELS[form.unit_type]}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Available Stock <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.single_stock}
                    onChange={(e) => handleChange('single_stock', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-semibold text-slate-900"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold uppercase text-slate-400">
                    {form.unit_type === 'per_kilo' ? 'kg / items' : form.unit_type === 'per_head' ? 'heads' : 'units'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Total inventory available for sale
                </p>
              </div>
            </div>
          )}

          {/* Description (Optional) */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Product details, breed, freshness..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
            />
          </div>

          {/* Product Image */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-brand file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand/90 focus:outline-none"
            />

            {/* Live preview */}
            <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 max-w-sm h-48">
              <img
                src={imagePreview || getProductCategoryDefaultImage(form.category)}
                alt="Product preview"
                onError={(e) => {
                  e.currentTarget.src = getProductCategoryDefaultImage(form.category);
                }}
                className="h-full w-full object-cover"
              />
              {(imageFile || imagePreview) && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/75 hover:bg-red-600 text-white px-2.5 py-1 text-xs font-medium shadow-sm transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/seller/listings')}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default CreateProduct;
