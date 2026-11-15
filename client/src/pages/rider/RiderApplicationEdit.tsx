import React, { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  User,
  Phone,
  MapPin,
  Truck,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface RiderData {
  id: number;
  user_id: number;
  fullname: string;
  phone: string;
  address: string | null;
  photo_path: string | null;
  photo_url?: string;
  license_photo_path: string | null;
  license_url?: string;
  vehicle_type: string | null;
  plate_number: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string | null;
}

const RiderApplicationEdit: React.FC = () => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const passedMessage = (location.state as { message?: string } | null)?.message;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rider details
  const [rider, setRider] = useState<RiderData | null>(null);
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [plateNumber, setPlateNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Existing files
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [currentLicenseUrl, setCurrentLicenseUrl] = useState<string | null>(null);

  // New uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/rider/application');
      const riderData: RiderData = res.data.rider;
      setRider(riderData);
      setFullname(riderData.fullname || res.data.user?.fullname || '');
      setPhone(riderData.phone || res.data.user?.phone || '');
      setAddress(riderData.address || '');
      setVehicleType(riderData.vehicle_type || 'Motorcycle');
      setPlateNumber(riderData.plate_number || '');
      setCurrentPhotoUrl(riderData.photo_url || null);
      setCurrentLicenseUrl(riderData.license_url || null);
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load rider application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullname.trim()) {
      setError('Full Name is required');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!address.trim()) {
      setError('Complete address is required');
      return;
    }

    if (!currentPhotoUrl && !photoFile) {
      setError('Please upload your 2x2 ID photo');
      return;
    }

    if (!currentLicenseUrl && !licenseFile) {
      setError('Please upload a photo of your Driver’s License');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullname', fullname.trim());
      formData.append('phone', phone.trim());
      formData.append('address', address.trim());
      if (vehicleType.trim()) {
        formData.append('vehicle_type', vehicleType.trim());
      }
      if (plateNumber.trim()) {
        formData.append('plate_number', plateNumber.trim());
      }
      if (newPassword.trim()) {
        formData.append('password', newPassword.trim());
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (licenseFile) {
        formData.append('license', licenseFile);
      }

      const res = await api.post('/rider/application', formData);

      if (res.data.user) {
        setUser(res.data.user);
      }
      if (res.data.rider) {
        setRider(res.data.rider);
        setCurrentPhotoUrl(res.data.rider.photo_url || null);
        setCurrentLicenseUrl(res.data.rider.license_url || null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setLicenseFile(null);
        setLicensePreview(null);
      }

      setNewPassword('');
      setSuccessMessage('Your application has been updated and resubmitted for administrator review!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(', ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Failed to update application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const status = rider?.status || user?.status || 'pending';
  const isApproved = status === 'approved' || status === 'verified' || status === 'active';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  return (
    <Layout>
      <div className="mx-auto max-w-4xl py-2">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">Rider Onboarding & Verification</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">Rider Application & Documents</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Review and update your personal credentials, contact info, 2x2 photo, and driver's license.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchApplication}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
            {isApproved && (
              <Link
                to="/rider/dashboard"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Passed Notice */}
        {passedMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{passedMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{successMessage}</p>
              <p className="mt-1 text-xs text-emerald-700">
                The status has been set back to <strong>Pending</strong>. Platform administrators have been notified of your updated documents.
              </p>
            </div>
          </div>
        )}

        {/* Global Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* STATUS BANNER */}
        {isRejected && (
          <div className="mb-8 rounded-3xl border-2 border-rose-200 bg-rose-50/80 p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-rose-900">Application Rejected</h3>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold uppercase text-rose-800 border border-rose-300">
                    Needs Correction
                  </span>
                </div>
                <p className="mt-1 text-sm text-rose-800">
                  Your rider registration application was reviewed and rejected by an administrator. Please correct your details or re-upload clearer document photos below and click <strong>Resubmit Application</strong>.
                </p>

                {/* Specific rejection reason box */}
                {rider?.rejection_reason ? (
                  <div className="mt-3.5 rounded-2xl border border-rose-300 bg-white p-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Administrator Feedback Note:</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 italic">
                      "{rider.rejection_reason}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-3.5 rounded-2xl border border-rose-200 bg-white/70 p-3 text-xs text-slate-700">
                    <span className="font-semibold text-rose-700">Notice:</span> Please make sure your 2x2 photo is recent and that your Driver's License photo is crisp, clearly legible, and shows your entire license card.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-amber-900">Application Pending Review</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase text-amber-800 border border-amber-300">
                    Pending
                  </span>
                </div>
                <p className="mt-1 text-sm text-amber-800">
                  Your registration is currently under review by our platform administration team. While you wait, you may update your personal details or re-upload your files if any information needs to be corrected.
                </p>
              </div>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-emerald-900">Application Approved & Verified</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800 border border-emerald-300">
                    Active Rider
                  </span>
                </div>
                <p className="mt-1 text-sm text-emerald-800">
                  Your credentials have been verified! You are fully authorized to accept and deliver orders. You can keep your profile details updated below.
                </p>
                <div className="mt-3">
                  <Link
                    to="/rider/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                  >
                    View Active Deliveries
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state skeleton */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-card">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Loading your application details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Documents & Identification */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-brand">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verification Documents</h2>
                  <p className="text-xs text-slate-500">
                    Re-upload your 2x2 ID photo and Driver’s License if previous files were unclear or rejected.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* 2x2 Photo Section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      2x2 ID Profile Photo
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Clear, front-facing ID photo with a white or plain background.
                    </p>

                    <div className="mt-4 flex flex-col items-center">
                      <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-inner flex items-center justify-center">
                        {photoPreview ? (
                          <img src={photoPreview} alt="New 2x2 Preview" className="h-full w-full object-cover" />
                        ) : currentPhotoUrl ? (
                          <img src={currentPhotoUrl} alt="Current 2x2 Photo" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-slate-300" />
                        )}
                      </div>

                      {photoPreview ? (
                        <span className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          New photo ready to upload
                        </span>
                      ) : currentPhotoUrl ? (
                        <span className="mt-2 text-xs font-medium text-slate-500">
                          Current uploaded photo
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-slate-500" />
                      {currentPhotoUrl || photoPreview ? 'Change / Re-upload 2x2 Photo' : 'Upload 2x2 Photo'}
                    </button>
                  </div>
                </div>

                {/* Driver's License Section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Driver’s License Document
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Official government-issued Driver’s License (JPEG, PNG, or PDF).
                    </p>

                    <div className="mt-4 flex flex-col items-center">
                      <div className="relative h-36 w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-inner flex items-center justify-center p-2">
                        {licensePreview ? (
                          <img src={licensePreview} alt="New License Preview" className="h-full w-full object-contain" />
                        ) : currentLicenseUrl ? (
                          <div className="flex flex-col items-center justify-center text-center">
                            <img src={currentLicenseUrl} alt="Current License Document" className="max-h-24 max-w-full rounded-lg object-contain shadow-xs" />
                            <a
                              href={currentLicenseUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View current full document
                            </a>
                          </div>
                        ) : (
                          <FileText className="h-12 w-12 text-slate-300" />
                        )}
                      </div>

                      {licensePreview ? (
                        <span className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          New license ready to upload
                        </span>
                      ) : licenseFile ? (
                        <span className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {licenseFile.name}
                        </span>
                      ) : currentLicenseUrl ? (
                        <span className="mt-2 text-xs font-medium text-slate-500">
                          Current uploaded license on file
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleLicenseChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-slate-500" />
                      {currentLicenseUrl || licenseFile ? 'Change / Re-upload Driver’s License' : 'Upload Driver’s License'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Personal Details */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-brand">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal & Contact Information</h2>
                  <p className="text-xs text-slate-500">Ensure your contact details and home address are accurate.</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullname" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Full Legal Name
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Enter your full legal name"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Active Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Complete Residential Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Barangay, Municipality / City, Province"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Vehicle Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-brand">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Vehicle Information (Optional)</h2>
                  <p className="text-xs text-slate-500">Provide details about the vehicle you will use for poultry deliveries.</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="vehicleType" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Vehicle Type
                  </label>
                  <select
                    id="vehicleType"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 bg-white"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Tricycle">Tricycle</option>
                    <option value="Bicycle">Bicycle / E-Bike</option>
                    <option value="Van">Van / L300</option>
                    <option value="Pickup">Pickup / Light Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="plateNumber" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Plate Number / Registration
                  </label>
                  <input
                    id="plateNumber"
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. ABC 1234 or MV File #"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Security (Optional) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-brand">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Update Password (Optional)</h2>
                  <p className="text-xs text-slate-500">Leave this field blank to keep your existing password.</p>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty if not changing password"
                  className="w-full max-w-md rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                {isRejected ? (
                  <p className="text-rose-700 font-medium">
                    Resubmitting will reset your application status to <strong>Pending</strong> for admin review.
                  </p>
                ) : (
                  <p>
                    Please verify that all uploaded photos are clear and legible before submitting.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/rider/dashboard')}
                  className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  Cancel / Return
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-8 py-3.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving & Resubmitting...
                    </>
                  ) : isRejected ? (
                    'Resubmit Application for Review'
                  ) : (
                    'Save & Update Application'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default RiderApplicationEdit;
