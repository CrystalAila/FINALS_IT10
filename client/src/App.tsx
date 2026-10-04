import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { CustomerLocationProvider } from './context/CustomerLocationContext';
import AppRouter from './AppRouter';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <CustomerLocationProvider>
            <AppRouter />
          </CustomerLocationProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
