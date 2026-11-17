import type { User } from '../context/AuthContext';

export function getStoredUser(contextUser: User | null): User | null {
  if (contextUser) return contextUser;
  const raw = localStorage.getItem('poultry_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function hasValidSession(contextUser: User | null, contextToken?: string | null): boolean {
  const storedToken = localStorage.getItem('poultry_token');
  const activeToken = contextToken || storedToken;
  const activeUser = getStoredUser(contextUser);
  return Boolean(activeUser && activeToken && storedToken);
}

export function isSellerIncomplete(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role !== 'seller' && role !== 'reseller') return false;
  const status = (user.status || '').toLowerCase();
  if (status === 'verified' || status === 'approved') return false;
  if (
    user.farm &&
    (user.farm.permit_file ||
      user.farm.permit_status === 'approved' ||
      user.farm.permit_status === 'pending' ||
      user.farm.permit_status === 'under_review' ||
      user.farm.permit_status === 'rejected')
  ) {
    return false;
  }
  return true;
}

export function isRiderIncomplete(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role !== 'rider') return false;
  const status = (user.status || '').toLowerCase();
  if (status === 'verified' || status === 'approved') return false;
  if (
    user.rider &&
    (user.rider.license_photo_path ||
      user.rider.photo_path ||
      user.rider.status === 'approved' ||
      user.rider.status === 'pending' ||
      user.rider.status === 'rejected')
  ) {
    return false;
  }
  return true;
}

export function isUserApproved(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const status = (user.status || '').toLowerCase();

  if (role === 'seller' || role === 'reseller') {
    if (isSellerIncomplete(user)) return false;
    if (status === 'verified' || status === 'approved') return true;
    if (user.farm?.permit_status === 'approved') return true;
    if (
      status === 'active' &&
      user.farm &&
      user.farm.permit_status !== 'pending' &&
      user.farm.permit_status !== 'under_review' &&
      user.farm.permit_status !== 'rejected'
    ) {
      return true;
    }
    return false;
  }

  if (role === 'rider') {
    if (isRiderIncomplete(user)) return false;
    if (status === 'verified' || status === 'approved') return true;
    if (user.rider?.status === 'approved') return true;
    if (
      status === 'active' &&
      user.rider &&
      user.rider.status !== 'pending' &&
      user.rider.status !== 'rejected'
    ) {
      return true;
    }
    return false;
  }

  return status === 'verified' || status === 'approved' || status === 'active';
}

export function getSellerOnboardingUrl(user: User | null | undefined): string {
  const params = new URLSearchParams({
    google_id: user?.google_id || String(user?.id || ''),
    email: user?.email || '',
    fullname: user?.fullname || '',
    role: 'seller',
  }).toString();
  return `/register/google-complete?${params}`;
}

export function getRiderOnboardingUrl(user: User | null | undefined): string {
  const params = new URLSearchParams({
    google_id: user?.google_id || String(user?.id || ''),
    email: user?.email || '',
    fullname: user?.fullname || '',
    role: 'rider',
  }).toString();
  return `/rider/register/google-complete?${params}`;
}

export function getDestinationForUser(user: User | null | undefined): string {
  if (!user) return '/login';
  const role = (user.role || '').toLowerCase();

  if (role === 'admin') return '/admin/dashboard';
  if (role === 'customer') return '/customer';

  if (role === 'seller' || role === 'reseller') {
    if (isSellerIncomplete(user)) {
      return getSellerOnboardingUrl(user);
    }
    return isUserApproved(user) ? '/seller/dashboard' : '/account-status';
  }

  if (role === 'rider') {
    if (isRiderIncomplete(user)) {
      return getRiderOnboardingUrl(user);
    }
    return isUserApproved(user) ? '/rider/dashboard' : '/account-status';
  }

  return '/customer';
}
