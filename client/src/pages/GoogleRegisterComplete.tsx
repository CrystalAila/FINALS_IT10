import React, { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/customer/AuthLayout';
import api from '../lib/axios';
import { getDestinationForUser, getStoredUser } from '../utils/authRedirect';

const GoogleRegisterComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: contextUser, googleLogin } = useAuth();
  const authUser = getStoredUser(contextUser);

  const googleId = searchParams.get('google_id') || authUser?.google_id || (authUser?.id ? String(authUser.id) : 'seller_oauth');
  const initialEmail = searchParams.get('email') || authUser?.email || '';
  const initialFullname = searchParams.get('fullname') || authUser?.fullname || '';
  const role = searchParams.get('role') || (authUser?.role === 'reseller' ? 'seller' : authUser?.role) || 'seller';

  const [fullname, setFullname] = useState(initialFullname);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  
  // Seller-specific fields
  const [businessName, setBusinessName] = useState('');
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitIssueDate, setPermitIssueDate] = useState('');
  const [permitExpiryDate, setPermitExpiryDate] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (role === 'seller' && !permitFile) {
      setError('Please upload your business permit');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('google_id', googleId);
      formData.append('fullname', fullname);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', role);

      if (role === 'seller') {
        formData.append('business_name', businessName);
        if (permitFile) {
          formData.append('permit', permitFile);
        }
        formData.append('permit_issue_date', permitIssueDate);
        formData.append('permit_expiry_date', permitExpiryDate);
      }

      let res;
      try {
        res = await api.post('/auth/google/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (primaryErr: any) {
        const msg = (primaryErr?.response?.data?.message || '').toLowerCase();
        if (role === 'seller' && primaryErr?.response?.status === 422 && msg.includes('already registered')) {
          const fallbackData = new FormData();
          const randSuffix = Math.floor(1000 + Math.random() * 9000);
          const cleanUser = fullname.replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 10) || 'seller';
          fallbackData.append('fullname', fullname.trim());
          fallbackData.append('username', `${cleanUser}${randSuffix}`);
          fallbackData.append('business_name', businessName.trim());
          fallbackData.append('phone', phone.trim());
          fallbackData.append('password', `Google_${googleId.slice(0, 10) || randSuffix}!`);
          fallbackData.append('role', 'seller');
          fallbackData.append('status', 'pending');
          if (permitFile) {
            fallbackData.append('permit', permitFile);
          }
          fallbackData.append('permit_issue_date', permitIssueDate);
          fallbackData.append('permit_expiry_date', permitExpiryDate);

          res = await api.post('/register', fallbackData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          throw primaryErr;
        }
      }

      const { user, token } = res.data;
      localStorage.removeItem('poultry_role_override');
      googleLogin(user, token);
      navigate(getDestinationForUser(user), { replace: true });
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat().join(', ');
        setError(messages);
      } else {
        setError(errorData?.message ?? 'Failed to complete registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isSeller = role === 'seller';

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle={isSeller ? "Add your shop details to start selling on PoultryLink" : "Confirm your details to join PoultryLink"}
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

        {isSeller && (
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
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Email {isSeller ? '' : '(optional)'}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required={isSeller}
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

        {isSeller && (
          <>
            <div>
              <label htmlFor="permit" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Business Permit (Image or PDF)
              </label>
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
            </div>

            <div>
              <label htmlFor="permitIssueDate" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Date Issued
              </label>
              <input
                id="permitIssueDate"
                type="date"
                value={permitIssueDate}
                onChange={(e) => setPermitIssueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Completing profile...' : 'Complete Profile & Register'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default GoogleRegisterComplete;
