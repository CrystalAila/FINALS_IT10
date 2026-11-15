import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/customer/AuthLayout';
import GoogleLoginButton from '../components/customer/GoogleLoginButton';
import LocationPicker from '../components/common/LocationPicker';
import { PermitDocumentViewer } from '../components/common/PermitDocumentViewer';
import { Eye, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const SellerRegister: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [fullAddress, setFullAddress] = useState('');
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitPreviewUrl, setPermitPreviewUrl] = useState<string | null>(null);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [permitIssueDate, setPermitIssueDate] = useState('');
  const [permitExpiryDate, setPermitExpiryDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Create preview URL when file changes
  useEffect(() => {
    if (!permitFile) {
      setPermitPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(permitFile);
    setPermitPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [permitFile]);

  // Handle setting expiry date to 1 year from issue date
  const handleAutoSetExpiry = (issueDateStr: string) => {
    if (!issueDateStr) return;
    const d = new Date(issueDateStr);
    if (!isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + 1);
      setPermitExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  // Expiry check
  const expiryAnalysis = useMemo(() => {
    if (!permitExpiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(permitExpiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', message: `Permit expired ${Math.abs(diffDays)} day(s) ago`, color: 'text-red-600 bg-red-50 border-red-200' };
    }
    if (diffDays <= 30) {
      return { status: 'warning', message: `Permit expires soon (${diffDays} days left)`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { status: 'valid', message: `Permit is valid (${diffDays} days remaining)`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }, [permitExpiryDate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!permitFile) {
      setError('Please upload your business permit');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullname', fullname);
      formData.append('business_name', businessName);
      formData.append('password', password);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', 'seller');
      formData.append('status', 'pending');
      formData.append('permit', permitFile);
      formData.append('permit_issue_date', permitIssueDate);
      formData.append('permit_expiry_date', permitExpiryDate);
      if (latitude !== null) {
        formData.append('latitude', latitude.toString());
      }
      if (longitude !== null) {
        formData.append('longitude', longitude.toString());
      }
      if (fullAddress.trim()) {
        formData.append('full_address', fullAddress.trim());
      }

      await register(formData);
      navigate('/account-status');
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(', ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Registration failed');
      }
    }
  };

  return (
    <AuthLayout
      title="Register as a seller"
      subtitle="Submit your shop details and start selling on PoultryLink"
      footer={
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/seller-login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            id="fullname"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="businessName" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Business Name
          </label>
          <input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
            minLength={6}
          />
        </div>

        <div>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            fullAddress={fullAddress}
            onChange={({ latitude: lat, longitude: lng, fullAddress: addr }) => {
              setLatitude(lat);
              setLongitude(lng);
              setFullAddress(addr);
            }}
            label="Shop Location (Map Pin)"
            helperText="Search your location or click on the map to drop a pin for your poultry shop."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="permit" className="block text-sm font-semibold text-gray-700">
              Business Permit (Image or PDF)
            </label>
            {permitFile && permitPreviewUrl && (
              <button
                type="button"
                onClick={() => setShowPermitModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                Inspect / Preview Document
              </button>
            )}
          </div>

          <input
            id="permit"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setPermitFile(e.target.files[0]);
              }
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand hover:file:bg-brand/20"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="permitIssueDate" className="block text-sm font-semibold text-gray-700">
                  Date Issued
                </label>
                {permitIssueDate && (
                  <button
                    type="button"
                    onClick={() => handleAutoSetExpiry(permitIssueDate)}
                    className="text-[11px] font-semibold text-brand hover:underline cursor-pointer"
                    title="Calculate expiry as 1 year from issue date"
                  >
                    +1 Year Validity
                  </button>
                )}
              </div>
              <input
                id="permitIssueDate"
                type="date"
                value={permitIssueDate}
                onChange={(e) => {
                  setPermitIssueDate(e.target.value);
                  if (!permitExpiryDate) {
                    handleAutoSetExpiry(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="permitExpiryDate" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Date of Expiration
              </label>
              <input
                id="permitExpiryDate"
                type="date"
                value={permitExpiryDate}
                onChange={(e) => setPermitExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                required
              />
            </div>
          </div>

          {/* Expiry Warning Alert */}
          {expiryAnalysis && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${expiryAnalysis.color}`}>
              {expiryAnalysis.status === 'expired' && <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />}
              {expiryAnalysis.status === 'warning' && <Clock className="h-4 w-4 shrink-0 text-amber-600" />}
              {expiryAnalysis.status === 'valid' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
              <span>{expiryAnalysis.message}</span>
            </div>
          )}
        </div>

        {/* Modal viewer for permit file */}
        {showPermitModal && permitPreviewUrl && (
          <PermitDocumentViewer
            open={showPermitModal}
            onClose={() => setShowPermitModal(false)}
            documentUrl={permitPreviewUrl}
            title={businessName ? `${businessName} - Business Permit` : 'Business Permit Preview'}
            subtitle={permitFile?.name}
            permitIssueDate={permitIssueDate}
            permitExpiryDate={permitExpiryDate}
            allowDateEditing={false}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Registering seller...' : 'Register as Seller'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      <GoogleLoginButton role="seller" disabled={loading} text="Sign in with Google" />
    </AuthLayout>
  );
};

export default SellerRegister;
