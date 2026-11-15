import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/customer/AuthLayout';
import api from '../../lib/axios';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  MapPin,
  Phone,
  Truck,
  Upload,
  User,
} from 'lucide-react';

const RiderGoogleRegisterComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  // Pre-filled from Google OAuth callback
  const googleId    = searchParams.get('google_id') || '';
  const initialEmail    = searchParams.get('email') || '';
  const initialFullname = searchParams.get('fullname') || '';

  // Form fields
  const [fullname, setFullname]     = useState(initialFullname);
  const [email, setEmail]           = useState(initialEmail);
  const [phone, setPhone]           = useState('');
  const [address, setAddress]       = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [plateNumber, setPlateNumber] = useState('');

  // File uploads
  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile]   = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const photoInputRef   = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Guard: if no google_id in URL, redirect to rider login
  if (!googleId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-rose-500 font-bold text-lg">Invalid Access</div>
          <p className="text-gray-600 mb-6">
            This page can only be accessed after a Google sign-in attempt.
          </p>
          <Link
            to="/rider/login"
            className="inline-block w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] py-3 px-5 text-sm font-semibold text-white shadow-sm transition text-center"
          >
            Go to Rider Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleLicenseChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLicenseFile(file);
      if (file.type.startsWith('image/')) {
        setLicensePreview(URL.createObjectURL(file));
      } else {
        setLicensePreview(null);
      }
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!address.trim()) {
      setError('Home / base address is required.');
      return;
    }
    if (!photoFile) {
      setError('Please upload your 2x2 ID photo.');
      return;
    }
    if (!licenseFile) {
      setError("Please upload a photo of your Driver's License.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('google_id', googleId);
      formData.append('fullname', fullname.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('address', address.trim());
      formData.append('photo', photoFile);
      formData.append('license', licenseFile);
      if (vehicleType.trim()) formData.append('vehicle_type', vehicleType.trim());
      if (plateNumber.trim()) formData.append('plate_number', plateNumber.trim());

      const res = await api.post('/auth/google/rider-register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { user, token } = res.data;

      // Log the rider in and send them to the account status page (pending state)
      googleLogin(user, token);
      navigate('/account-status', { replace: true });
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(' ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Complete Rider Application"
      subtitle="A few more details needed to submit your Google-linked rider account"
      footer={
        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>
            Already have a rider account?{' '}
            <Link to="/rider/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Changed your mind?{' '}
            <Link to="/login" className="text-brand hover:underline">
              Customer Portal
            </Link>
          </p>
        </div>
      }
    >
      {/* Google account info banner */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-800 truncate">{initialFullname || 'Google Account'}</p>
          {initialEmail && (
            <p className="text-xs text-blue-600 truncate">{initialEmail}</p>
          )}
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
          Linked
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {/* Full Name (pre-filled, editable) */}
        <div>
          <label htmlFor="fullname" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullname"
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        {/* Phone & Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 6789"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email <span className="text-slate-400 font-normal lowercase">(from Google)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            Home / Base Address <span className="text-red-500">*</span>
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Barangay, City, Province (e.g. Tanque, Roxas City, Capiz)"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        {/* Document uploads section */}
        <div className="pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Required Verification Documents</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin will review these before approving your account.</p>
        </div>

        {/* 2x2 Photo Upload */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-50/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {photoPreview ? (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-brand/40 shadow-sm">
                  <img src={photoPreview} alt="2x2 Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-brand">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2x2 ID Photo <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {photoFile ? photoFile.name : 'Clear formal 2x2 headshot (JPG, PNG)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              {photoFile ? 'Change' : 'Upload 2x2'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Driver's License Upload */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-50/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {licensePreview ? (
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-brand/40 shadow-sm">
                  <img src={licensePreview} alt="License Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Driver's License <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {licenseFile ? licenseFile.name : "Clear photo of valid Driver's License (JPG, PNG, PDF)"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => licenseInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              {licenseFile ? 'Change' : 'Upload License'}
            </button>
            <input
              ref={licenseInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleLicenseChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Vehicle details (optional) */}
        <div className="pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Vehicle Details (Optional)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="vehicleType" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Truck className="h-3.5 w-3.5 text-slate-400" />
              Vehicle Type
            </label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
            >
              <option value="Motorcycle">Motorcycle</option>
              <option value="Scooter">Scooter</option>
              <option value="Bicycle">Bicycle</option>
              <option value="E-Bike">E-Bike</option>
              <option value="Tricycle">Tricycle</option>
              <option value="Car / Sedan">Car / Sedan</option>
              <option value="Van / Multi-cab">Van / Multi-cab</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="plateNumber" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Plate Number / Reg.
            </label>
            <input
              id="plateNumber"
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. 123 ABC or N/A"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Your account will be <span className="font-semibold">pending approval</span> after submission. An administrator will review your documents before you can start claiming deliveries.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3.5 px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting application...
            </>
          ) : (
            'Submit Rider Application'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RiderGoogleRegisterComplete;

