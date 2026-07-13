import { Navigate, Route, Routes } from 'react-router-dom';
import SellerDashboard from './SellerDashboard';
import ShopConfiguration from './ShopConfiguration';
import MyListings from './MyListings';
import CreateProduct from './CreateProduct';
import OrderFulfillment from './OrderFulfillment';
import RiderRegistry from './RiderRegistry';

export default function SellerRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<SellerDashboard />} />
      <Route path="shop" element={<ShopConfiguration />} />
      <Route path="listings" element={<MyListings />} />
      <Route path="listings/new" element={<CreateProduct />} />
      <Route path="orders" element={<OrderFulfillment />} />
      <Route path="riders" element={<RiderRegistry />} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
