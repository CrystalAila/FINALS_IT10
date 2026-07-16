import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: ReactNode;
  allowedRoles?: string | string[];
};

const toArray = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : v.split(',').map((s) => s.trim())) : []);

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Seller verification status guard
  if ((user.role === 'seller' || user.role === 'reseller') && user.status !== 'verified') {
    if (window.location.pathname !== '/seller/verification') {
      return <Navigate to="/seller/verification" replace />;
    }
  } else if ((user.role === 'seller' || user.role === 'reseller') && user.status === 'verified') {
    if (window.location.pathname === '/seller/verification') {
      return <Navigate to="/seller/dashboard" replace />;
    }
  }

  const allowed = toArray(allowedRoles);
  if (allowed.length > 0 && !allowed.includes(user.role)) {
    // redirect to user's base dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
