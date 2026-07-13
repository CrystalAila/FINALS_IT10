import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerRoutes from './pages/customer/CustomerRoutes';
import ResellerDashboard from './pages/dashboards/ResellerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  const homeRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'customer') return '/customer';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/reseller/dashboard';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          path="/reseller/*"
          element={
            <ProtectedRoute allowedRoles={['reseller']}>
              <ResellerDashboard />
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

        <Route path="/" element={<Navigate to={homeRedirect()} replace />} />
        <Route path="*" element={<div className="p-4">Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
