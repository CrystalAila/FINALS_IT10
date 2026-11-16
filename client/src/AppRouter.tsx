import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SellerLogin from './pages/SellerLogin';
import Register from './pages/Register';
import SellerRegister from './pages/SellerRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerRoutes from './pages/customer/CustomerRoutes';
import GoogleCallback from './pages/GoogleCallback';
import GoogleRegisterComplete from './pages/GoogleRegisterComplete';
import RiderLogin from './pages/rider/RiderLogin';
import RiderRegister from './pages/rider/RiderRegister';
import RiderGoogleRegisterComplete from './pages/rider/RiderGoogleRegisterComplete';
import RiderDashboard from './pages/rider/RiderDashboard';
import RiderOrderDetails from './pages/rider/RiderOrderDetails';
import RiderApplicationEdit from './pages/rider/RiderApplicationEdit';
import SellerRoutes from './pages/seller/SellerRoutes';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import AdminPermits from './pages/AdminPermits';
import AdminRiders from './pages/AdminRiders';
import AdminMarket from './pages/AdminMarket';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminShares from './pages/AdminShares';
import AccountStatus from './pages/AccountStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  const homeRedirect = () => {
    const hasToken = Boolean(localStorage.getItem('poultry_token'));
    if (!user || !hasToken) return '/login';
    if (user.role === 'customer') return '/customer';
    if (user.role === 'admin') return '/admin/dashboard';
    const isApproved = user.status === 'verified' || (user.status as string) === 'approved' || user.status === 'active';
    if (user.role === 'rider') {
      return isApproved ? '/rider/dashboard' : '/account-status';
    }
    return isApproved ? '/seller/dashboard' : '/account-status';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/seller-login" element={<SellerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/seller-register" element={<SellerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="/register/google-complete" element={<GoogleRegisterComplete />} />
        <Route path="/rider/login" element={<RiderLogin />} />
        <Route path="/rider/register" element={<RiderRegister />} />
        <Route path="/rider/register/google-complete" element={<RiderGoogleRegisterComplete />} />
        <Route
          path="/account-status"
          element={
            <ProtectedRoute>
              <AccountStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-approval"
          element={
            <ProtectedRoute>
              <AccountStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/dashboard"
          element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/application"
          element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderApplicationEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerRoutes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/*"
          element={
            <ProtectedRoute allowedRoles={['seller', 'reseller']}>
              <SellerRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reseller/*"
          element={
            <ProtectedRoute allowedRoles={['seller', 'reseller']}>
              <SellerRoutes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/permits"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPermits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/riders"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRiders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/market"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMarket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shares"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminShares />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Internal Link Shortcuts / Copied URL Aliases */}
        <Route path="/cart" element={<Navigate to="/customer/cart" replace />} />
        <Route path="/checkout" element={<Navigate to="/customer/checkout" replace />} />
        <Route path="/orders" element={<Navigate to="/customer/orders" replace />} />
        <Route path="/orders/:id" element={<Navigate to="/customer/orders" replace />} />
        <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
        <Route path="/addresses" element={<Navigate to="/customer/addresses" replace />} />
        <Route path="/listings" element={<Navigate to="/seller/listings" replace />} />
        <Route path="/shop" element={<Navigate to="/seller/shop" replace />} />
        <Route path="/dashboard" element={<Navigate to={homeRedirect()} replace />} />

        <Route path="/" element={<Navigate to={homeRedirect()} replace />} />
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/reseller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/rider" element={<Navigate to="/rider/dashboard" replace />} />
        <Route
          path="*"
          element={
            !user || !localStorage.getItem('poultry_token') ? (
              <Navigate to="/login" replace />
            ) : (
              <Navigate to={homeRedirect()} replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
