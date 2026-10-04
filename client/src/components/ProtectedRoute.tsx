import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: ReactNode;
  allowedRoles?: string | string[];
};

const toArray = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : v.split(',').map((s) => s.trim())) : []);

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user, token, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  // Verify both active user and valid token
  const storedToken = localStorage.getItem('poultry_token');
  if (!user || !token || !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Seller verification status guard
  if ((user.role === 'seller' || user.role === 'reseller') && user.status !== 'verified') {
    const allowedPaths = ['/seller/dashboard', '/seller/verification', '/seller/shop'];
    const currentPath = location.pathname;
    if (!allowedPaths.some((path) => currentPath === path || currentPath.startsWith(path + '/'))) {
      return <Navigate to="/seller/dashboard" replace />;
    }
  } else if ((user.role === 'seller' || user.role === 'reseller') && user.status === 'verified') {
    if (location.pathname === '/seller/verification') {
      return <Navigate to="/seller/dashboard" replace />;
    }
  }

  const allowed = toArray(allowedRoles);
  if (allowed.length > 0 && !allowed.includes(user.role)) {
    // Redirect to user's appropriate role dashboard
    const roleDashboard =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'customer'
        ? '/customer'
        : user.role === 'rider'
        ? '/rider/dashboard'
        : '/seller/dashboard';
    return <Navigate to={roleDashboard} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
