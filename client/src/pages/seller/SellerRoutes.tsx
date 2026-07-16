import { Navigate, Route, Routes } from 'react-router-dom';
import SellerDashboard from './SellerDashboard';
import ShopConfiguration from './ShopConfiguration';
import MyListings from './MyListings';
import CreateProduct from './CreateProduct';
import OrderFulfillment from './OrderFulfillment';
import RiderRegistry from './RiderRegistry';
import SellerVerification from './SellerVerification';
import SalesReport from './SalesReport';

export default function SellerRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<SellerDashboard />} />
      <Route path="shop" element={<ShopConfiguration />} />
      <Route path="listings" element={<MyListings />} />
      <Route path="listings/new" element={<CreateProduct />} />
      <Route path="listings/edit/:id" element={<CreateProduct />} />
      <Route path="orders" element={<OrderFulfillment />} />
      <Route path="riders" element={<RiderRegistry />} />
      <Route path="verification" element={<SellerVerification />} />
      <Route path="sales-report" element={<SalesReport />} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
