import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userJson = searchParams.get('user');

    if (!token || !userJson) {
      setError('Invalid login response. Please try again.');
      return;
    }

    try {
      const user = JSON.parse(userJson);
      googleLogin(user, token);

      // Redirect based on role
      if (user.role === 'customer') {
        navigate('/customer', { replace: true });
      } else if (user.role === 'seller' || user.role === 'reseller') {
        navigate('/seller/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('Failed to process user information.');
    }
  }, [searchParams, googleLogin, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-rose-500 font-bold text-lg">Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
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
