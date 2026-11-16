import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, type User } from '../context/AuthContext';
import api from '../lib/axios';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const token = searchParams.get('token');
    const userJson = searchParams.get('user');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    if (!token) {
      setError('Invalid login response. No authentication token received.');
      return;
    }

    processedRef.current = true;

    const processAuth = async () => {
      try {
        // 1. Immediately persist token so any outgoing API requests have Authorization header
        localStorage.setItem('poultry_token', token);

        // 2. Fetch fresh authenticated user profile from /api/user
        let authenticatedUser: User | null = null;
        try {
          const res = await api.get('/user', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          authenticatedUser = res.data?.user as User;
        } catch (apiErr) {
          console.warn('Direct /api/user fetch in callback had error, checking query fallback', apiErr);
          if (userJson) {
            authenticatedUser = JSON.parse(decodeURIComponent(userJson)) as User;
          } else {
            throw apiErr;
          }
        }

        if (!authenticatedUser) {
          throw new Error('Failed to retrieve your user profile.');
        }

        // 3. Apply requested role from query params or saved OAuth portal role
        const savedOAuthRole = (sessionStorage.getItem('poultry_oauth_role') ||
          localStorage.getItem('poultry_oauth_role')) as User['role'] | null;
        sessionStorage.removeItem('poultry_oauth_role');
        localStorage.removeItem('poultry_oauth_role');

        const queryRole = (searchParams.get('role') || savedOAuthRole) as User['role'] | null;
        const originalBackendRole = authenticatedUser.role;

        if (queryRole && ['customer', 'seller', 'reseller', 'rider', 'admin'].includes(queryRole)) {
          if (queryRole !== 'customer' || !originalBackendRole) {
            authenticatedUser = {
              ...authenticatedUser,
              role: queryRole,
              status:
                originalBackendRole === 'customer' && (queryRole === 'seller' || queryRole === 'rider')
                  ? 'pending'
                  : authenticatedUser.status,
            };
            localStorage.setItem('poultry_role_override', queryRole);
          } else {
            localStorage.removeItem('poultry_role_override');
          }
        }
        googleLogin(authenticatedUser, token);

        // 4. Redirect cleanly based on role, onboarding state, and verification status
        const role = (
          (queryRole && queryRole !== 'customer' ? queryRole : null) ||
          authenticatedUser.role ||
          queryRole ||
          'customer'
        ).toLowerCase();
        const needsRegistrationParam = searchParams.get('needs_registration') === '1';
        const status = (authenticatedUser.status || '').toLowerCase();
        const isApproved = status === 'verified' || status === 'approved' || status === 'active';

        const googlePrefillParams = new URLSearchParams({
          google_id: searchParams.get('google_id') || authenticatedUser.google_id || String(authenticatedUser.id || ''),
          email: searchParams.get('email') || authenticatedUser.email || '',
          fullname: searchParams.get('fullname') || authenticatedUser.fullname || '',
          role: role === 'reseller' ? 'seller' : role,
        }).toString();

        if (role === 'seller' || role === 'reseller') {
          const incompleteSellerProfile =
            needsRegistrationParam || !authenticatedUser.farm || !authenticatedUser.farm.permit_file;
          if (incompleteSellerProfile) {
            navigate(`/register/google-complete?${googlePrefillParams}`, { replace: true });
          } else {
            navigate(isApproved ? '/seller/dashboard' : '/account-status', { replace: true });
          }
        } else if (role === 'rider') {
          const incompleteRiderProfile =
            needsRegistrationParam || !authenticatedUser.rider || !authenticatedUser.rider.license_photo_path;
          if (incompleteRiderProfile) {
            navigate(`/rider/register/google-complete?${googlePrefillParams}`, { replace: true });
          } else {
            navigate(isApproved ? '/rider/dashboard' : '/account-status', { replace: true });
          }
        } else if (role === 'customer') {
          navigate('/customer', { replace: true });
        } else if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err: any) {
        console.error('Failed to process Google authentication callback:', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to process Google sign in.';
        setError(msg);
      }
    };

    processAuth();
  }, [searchParams, googleLogin, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-rose-500 font-bold text-lg">Sign In Error</div>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 cursor-pointer"
          >
            Go back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-gray-600 font-medium">Completing secure sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
