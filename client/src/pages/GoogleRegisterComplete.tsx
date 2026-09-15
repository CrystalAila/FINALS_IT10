import React, { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/customer/AuthLayout';
import api from '../lib/axios';

const GoogleRegisterComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  const googleId = searchParams.get('google_id') || '';
  const initialEmail = searchParams.get('email') || '';
  const initialFullname = searchParams.get('fullname') || '';
  const role = searchParams.get('role') || 'customer';

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

      const res = await api.post('/auth/google/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { user, token } = res.data;
      googleLogin(user, token);

      if (user.role === 'customer') {
        navigate('/customer', { replace: true });
      } else if (user.role === 'seller' || user.role === 'reseller') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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
            Phone {isSeller ? '' : '(optional)'}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required={isSeller}
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
          className="w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Completing profile...' : 'Complete Profile & Register'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default GoogleRegisterComplete;
