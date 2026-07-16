import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SellerLogin from './pages/SellerLogin';
import Register from './pages/Register';
import SellerRegister from './pages/SellerRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerRoutes from './pages/customer/CustomerRoutes';
import SellerRoutes from './pages/seller/SellerRoutes';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import AdminPermits from './pages/AdminPermits';
import AdminMarket from './pages/AdminMarket';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  const homeRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'customer') return '/customer';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/seller/dashboard';
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
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={homeRedirect()} replace />} />
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/reseller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="*" element={<div className="p-4">Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
