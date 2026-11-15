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

  // Verify active user and token with localStorage fallback to prevent premature kicks
  const storedToken = localStorage.getItem('poultry_token');
  const storedUserRaw = localStorage.getItem('poultry_user');
  let activeUser = user;
  if (!activeUser && storedUserRaw) {
    try {
      activeUser = JSON.parse(storedUserRaw);
    } catch {
      activeUser = null;
    }
  }
  const activeToken = token || storedToken;

  if (!activeUser || !activeToken || !storedToken) {
    if (location.pathname.startsWith('/rider')) {
      return <Navigate to="/rider/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/seller')) {
      return <Navigate to="/seller-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Dedicated account status route is always accessible to any authenticated user
  if (location.pathname === '/account-status' || location.pathname === '/pending-approval') {
    return <>{children}</>;
  }

  const status = (activeUser.status || '').toLowerCase();
  const isApproved = status === 'verified' || status === 'approved' || status === 'active';

  // Rider approval guard: pending / rejected riders cannot access main operational dashboard
  if (activeUser.role === 'rider' && !isApproved) {
    const allowedUnapprovedRiderPaths = ['/account-status', '/pending-approval', '/rider/application'];
    const isAllowed = allowedUnapprovedRiderPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    );
    if (!isAllowed) {
      return <Navigate to="/account-status" replace />;
    }
  }

  // Seller approval guard: pending / rejected sellers cannot access main operational dashboard
  if ((activeUser.role === 'seller' || activeUser.role === 'reseller') && !isApproved) {
    const allowedUnapprovedSellerPaths = ['/account-status', '/pending-approval', '/seller/verification', '/seller/shop'];
    const isAllowed = allowedUnapprovedSellerPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    );
    if (!isAllowed) {
      return <Navigate to="/account-status" replace />;
    }
  }

  const allowed = toArray(allowedRoles);
  if (allowed.length > 0 && !allowed.includes(activeUser.role)) {
    // Redirect to user's appropriate role destination
    const roleDashboard =
      activeUser.role === 'admin'
        ? '/admin/dashboard'
        : activeUser.role === 'customer'
        ? '/customer'
        : activeUser.role === 'rider'
        ? isApproved
          ? '/rider/dashboard'
          : '/account-status'
        : isApproved
        ? '/seller/dashboard'
        : '/account-status';
    return <Navigate to={roleDashboard} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
