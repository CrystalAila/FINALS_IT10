import { Navigate, Route, Routes } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import AddressBookPage from './AddressBookPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import CustomerHomePage from './CustomerHomePage';
import OrderDetailPage from './OrderDetailPage';
import OrdersPage from './OrdersPage';
import ProductDetailPage from './ProductDetailPage';
import ProfilePage from './ProfilePage';
import ShopDetailsPage from './ShopDetailsPage';

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="shops/:id" element={<ShopDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="addresses" element={<AddressBookPage />} />
        <Route path="dashboard" element={<Navigate to="/customer" replace />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Route>
    </Routes>
  );
}
