import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDestinationForUser,
  getRiderOnboardingUrl,
  getSellerOnboardingUrl,
  getStoredUser,
  hasValidSession,
  isRiderIncomplete,
  isSellerIncomplete,
  isUserApproved,
} from '../utils/authRedirect';

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

  const activeUser = getStoredUser(user);

  if (!activeUser || !hasValidSession(user, token)) {
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

  const isApproved = isUserApproved(activeUser);

  // Rider onboarding & approval guard
  if (activeUser.role === 'rider') {
    if (isRiderIncomplete(activeUser)) {
      const allowedOnboardingPaths = [
        '/rider/register/google-complete',
        '/rider/onboarding',
        '/rider/register',
        '/rider/application',
      ];
      const onOnboardingPath = allowedOnboardingPaths.some(
        (path) => location.pathname === path || location.pathname.startsWith(path + '/')
      );
      if (!onOnboardingPath) {
        return <Navigate to={getRiderOnboardingUrl(activeUser)} replace />;
      }
      return <>{children}</>;
    }

    if (!isApproved) {
      const allowedUnapprovedRiderPaths = [
        '/account-status',
        '/pending-approval',
        '/rider/application',
        '/rider/register/google-complete',
        '/rider/onboarding',
      ];
      const isAllowed = allowedUnapprovedRiderPaths.some(
        (path) => location.pathname === path || location.pathname.startsWith(path + '/')
      );
      if (!isAllowed) {
        return <Navigate to="/account-status" replace />;
      }
    }
  }

  // Seller onboarding & approval guard
  if (activeUser.role === 'seller' || activeUser.role === 'reseller') {
    if (isSellerIncomplete(activeUser)) {
      const allowedOnboardingPaths = [
        '/register/google-complete',
        '/seller/onboarding',
        '/seller/register',
        '/seller-register',
        '/seller/verification',
        '/seller/shop',
      ];
      const onOnboardingPath = allowedOnboardingPaths.some(
        (path) => location.pathname === path || location.pathname.startsWith(path + '/')
      );
      if (!onOnboardingPath) {
        return <Navigate to={getSellerOnboardingUrl(activeUser)} replace />;
      }
      return <>{children}</>;
    }

    if (!isApproved) {
      const allowedUnapprovedSellerPaths = [
        '/account-status',
        '/pending-approval',
        '/seller/verification',
        '/seller/shop',
        '/register/google-complete',
        '/seller/onboarding',
      ];
      const isAllowed = allowedUnapprovedSellerPaths.some(
        (path) => location.pathname === path || location.pathname.startsWith(path + '/')
      );
      if (!isAllowed) {
        return <Navigate to="/account-status" replace />;
      }
    }
  }

  const allowed = toArray(allowedRoles);
  if (allowed.length > 0 && !allowed.includes(activeUser.role)) {
    return <Navigate to={getDestinationForUser(activeUser)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
