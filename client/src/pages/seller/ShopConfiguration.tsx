import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LocationPicker from '../../components/common/LocationPicker';
import PermitDocumentViewer from '../../components/common/PermitDocumentViewer';
import { Eye, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ShopConfiguration: React.FC = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<any>(null);
  const [showPermitViewer, setShowPermitViewer] = useState(false);

  // Check if permit is expiring soon
  const getDaysUntilExpiry = () => {
    if (!user || !user.farm || !user.farm.permit_expiry_date) return null;
    const expiryDate = new Date(user.farm.permit_expiry_date);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const daysRemaining = getDaysUntilExpiry();
  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;

  const [form, setForm] = useState({
    businessName: '',
    address: '',
    fullAddress: '',
    latitude: null as number | null,
    longitude: null as number | null,
    contactPerson: '',
    phone: '',
    permit: null as File | null,
    permitIssueDate: '',
    permitExpiryDate: '',
  });

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const res = await api.get('/seller/farm');
        const farm = res.data.farm;
        setFarmData(farm);
        const lat = farm.latitude !== null && farm.latitude !== undefined && farm.latitude !== '' ? parseFloat(farm.latitude) : null;
        const lng = farm.longitude !== null && farm.longitude !== undefined && farm.longitude !== '' ? parseFloat(farm.longitude) : null;
        const addr = farm.full_address || farm.location || '';
        setForm({
          businessName: farm.name || '',
          address: addr,
          fullAddress: addr,
          latitude: lat,
          longitude: lng,
          contactPerson: user?.fullname || '',
          phone: user?.phone || '',
          permit: null,
          permitIssueDate: farm.permit_issue_date || '',
          permitExpiryDate: farm.permit_expiry_date || '',
        });
      } catch (err) {
        console.error('Failed to load farm details:', err);
        toast.error('Failed to load shop configuration.');
      } finally {
        setLoading(false);
      }
    };
    loadFarm();
  }, [user]);

  const handleChange = (field: string, value: string | File | null | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', form.businessName);
      formData.append('location', form.fullAddress || form.address);
      formData.append('full_address', form.fullAddress || form.address);
      if (form.latitude !== null) {
        formData.append('latitude', form.latitude.toString());
      }
      if (form.longitude !== null) {
        formData.append('longitude', form.longitude.toString());
      }
      formData.append('description', 'Farm shop configuration details.');
      formData.append('permit_issue_date', form.permitIssueDate);
      formData.append('permit_expiry_date', form.permitExpiryDate);
      if (form.permit) {
        formData.append('permit', form.permit);
      }

      const res = await api.post('/seller/farm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.user) {
        setUser(res.data.user);
      }

      toast.success('Shop configuration saved successfully.');
      setIsEditing(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to save shop info.';
      setError(errMsg);
      toast.error(errMsg);
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shop Configuration</h1>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            Edit Shop
          </button>
        )}
      </div>

      {user && user.status === 'verified' && isExpiringSoon && (
        <div className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 text-orange-800 shadow-sm flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Business Permit Near Expiration</h3>
            <p className="mt-1 text-sm text-orange-700">
              Your LGU Business Permit is expiring in <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> (on {new Date(user.farm.permit_expiry_date).toLocaleDateString()}).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      {!isEditing ? (
        /* Read-only View Mode */
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Name</span>
              <p className="mt-1 text-base font-semibold text-slate-900">{form.businessName || 'Not configured'}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Shop Address</span>
              <p className="mt-1 text-base font-semibold text-slate-900">{form.address || 'Not configured'}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Person</span>
              <p className="mt-1 text-base font-semibold text-slate-900">{form.contactPerson || user?.fullname}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</span>
              <p className="mt-1 text-base font-semibold text-slate-900">{form.phone || user?.phone || 'N/A'}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Permit Date Issued</span>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {form.permitIssueDate ? new Date(form.permitIssueDate).toLocaleDateString() : 'None'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Permit Expiry Date</span>
                {daysRemaining !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      daysRemaining < 0
                        ? 'bg-rose-100 text-rose-800'
                        : isExpiringSoon
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {daysRemaining < 0 ? 'EXPIRED' : isExpiringSoon ? `${daysRemaining}d left` : 'Valid'}
                  </span>
                )}
              </div>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {form.permitExpiryDate ? new Date(form.permitExpiryDate).toLocaleDateString() : 'None'}
              </p>
            </div>

            {farmData?.permit_file && (
              <div className="sm:col-span-2 rounded-2xl bg-orange-50/60 border border-orange-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#D96B27] flex items-center justify-center shrink-0">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Official LGU Business Permit</h4>
                    <p className="text-xs text-slate-500">
                      Uploaded file: <span className="font-mono text-slate-700">{farmData.permit_file.split('/').pop()}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPermitViewer(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Permit (Zoom & Pan)</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              fullAddress={form.fullAddress || form.address}
              onChange={() => {}}
              readOnly={true}
              label="Shop Location on Map"
              helperText=""
            />
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Business name</label>
              <input
                value={form.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Contact person</label>
              <input
                value={form.contactPerson}
                className="w-full rounded-2xl border border-slate-200 bg-slate-200/70 px-4 py-3 outline-none cursor-not-allowed text-sm text-slate-600"
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
              <input
                value={form.phone}
                className="w-full rounded-2xl border border-slate-200 bg-slate-200/70 px-4 py-3 outline-none cursor-not-allowed text-sm text-slate-600"
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Shop address</label>
              <input
                value={form.fullAddress || form.address}
                onChange={(e) => {
                  handleChange('address', e.target.value);
                  handleChange('fullAddress', e.target.value);
                }}
                placeholder="Select on the map or type address..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required
              />
            </div>

            <div className="lg:col-span-2">
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                fullAddress={form.fullAddress || form.address}
                onChange={({ latitude: lat, longitude: lng, fullAddress: addr }) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    fullAddress: addr,
                    address: addr,
                  }));
                }}
                label="Interactive Map Location Picker"
                helperText="Search your location or click anywhere on the map to drop a pin. Address and coordinates are updated automatically."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Date Issued (LGU Permit)</label>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleChange('permitIssueDate', today);
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    handleChange('permitExpiryDate', nextYear.toISOString().split('T')[0]);
                  }}
                  className="text-xs font-semibold text-[#D96B27] hover:underline"
                >
                  Set Today & +1 Year
                </button>
              </div>
              <input
                type="date"
                value={form.permitIssueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('permitIssueDate', val);
                  if (val && !form.permitExpiryDate) {
                    const issue = new Date(val);
                    if (!isNaN(issue.getTime())) {
                      const next = new Date(issue);
                      next.setFullYear(next.getFullYear() + 1);
                      handleChange('permitExpiryDate', next.toISOString().split('T')[0]);
                    }
                  }
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required={!!form.permit}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Date of Expiration (LGU Permit)</label>
              <input
                type="date"
                value={form.permitExpiryDate}
                onChange={(e) => handleChange('permitExpiryDate', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required={!!form.permit}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">LGU permit upload</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleChange('permit', e.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-brand file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">Uploading a new permit will reset verification status for review.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
      {/* Interactive Permit Viewer Modal */}
      <PermitDocumentViewer
        open={showPermitViewer}
        onClose={() => setShowPermitViewer(false)}
        documentUrl={
          farmData?.permit_file
            ? farmData.permit_file.startsWith('http')
              ? farmData.permit_file
              : `/storage/${farmData.permit_file}`
            : null
        }
        title={form.businessName || 'Business Permit'}
        subtitle={`LGU Mayor's / Business Permit • Status: ${farmData?.permit_status || 'Pending Review'}`}
        permitIssueDate={form.permitIssueDate}
        permitExpiryDate={form.permitExpiryDate}
        allowDateEditing={false}
      />
    </Layout>
  );
};

export default ShopConfiguration;
