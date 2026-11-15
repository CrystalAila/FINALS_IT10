import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/customer/AuthLayout';
import { CheckCircle2, Upload, Eye, EyeOff, User, Phone, MapPin, Lock, FileText, Truck } from 'lucide-react';

const RiderRegister: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // File uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  // Vehicle info (optional)
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [plateNumber, setPlateNumber] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { registerRider, loading } = useAuth();
  const navigate = useNavigate();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!address.trim()) {
      setError('Complete residential address is required');
      return;
    }

    if (!photoFile) {
      setError('Please upload your 2x2 ID photo');
      return;
    }

    if (!licenseFile) {
      setError('Please upload a clear photo of your Driver’s License');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullname', fullname.trim());
      if (username.trim()) {
        formData.append('username', username.trim());
      }
      formData.append('phone', phone.trim());
      formData.append('address', address.trim());
      formData.append('password', password);
      formData.append('photo', photoFile);
      formData.append('license', licenseFile);
      if (vehicleType.trim()) {
        formData.append('vehicle_type', vehicleType.trim());
      }
      if (plateNumber.trim()) {
        formData.append('plate_number', plateNumber.trim());
      }

      await registerRider(formData);
      setIsSubmitted(true);
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(', ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Registration submission failed. Please try again.');
      }
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Application Submitted!"
        subtitle="Thank you for applying to be a PoultryLink delivery rider"
      >
        <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">Application Pending Approval</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your rider registration was submitted successfully with status{' '}
            <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>.
          </p>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Our platform administrators will inspect and verify your 2x2 photo and Driver’s License. Once approved, you will be able to log in to start claiming deliveries!
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/rider/login', { state: { message: 'Registration submitted! Please sign in once approved.' } })}
              className="w-full rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] py-3.5 px-5 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
            >
              Return to Rider Sign In
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Back to Main Portal
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Rider Registration"
      subtitle="Register as an independent delivery rider and start earning"
      footer={
        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>
            Already have a rider account?{' '}
            <Link to="/rider/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Are you a customer or seller?{' '}
            <Link to="/login" className="text-brand hover:underline">
              Customer Login
            </Link>{' '}
            •{' '}
            <Link to="/seller-login" className="text-brand hover:underline">
              Seller Login
            </Link>
          </p>
        </div>
      }
    >
      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {/* Full Name */}
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

        {/* Username & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Username <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. juan_rider"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

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

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
              minLength={6}
            />
          </div>
        </div>

        {/* Document Uploads Header */}
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Required Verification Documents</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin will review these documents before approving your account.</p>
        </div>

        {/* 2x2 Photo Upload */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-brand/40 shadow-sm shrink-0">
                  <img src={photoPreview} alt="2x2 Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-brand shrink-0">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2x2 ID Photo <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {photoFile ? photoFile.name : 'Clear formal 2x2 headshot (JPG, PNG)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {licensePreview ? (
                <div className="h-16 w-24 overflow-hidden rounded-xl border-2 border-brand/40 shadow-sm shrink-0">
                  <img src={licensePreview} alt="License Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Photo of Driver’s License <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {licenseFile ? licenseFile.name : 'Clear photo of valid Driver’s License (JPG, PNG, PDF)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => licenseInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
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

        {/* Vehicle Information (Optional) */}
        <div className="pt-2">
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3.5 px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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

export default RiderRegister;
