import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/customer/AuthLayout';

const SellerRegister: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const user = await register({
        fullname,
        username: businessName.replace(/\s+/g, '').toLowerCase().slice(0, 20),
        password,
        email: email || undefined,
        phone: phone || undefined,
        business_name: businessName,
        role: 'seller',
        status: 'pending',
      });

      if (user.role === 'seller' || user.role === 'reseller') {
        navigate('/seller/dashboard', {
          state: { message: 'Your shop is under review. Please upload your LGU permit.' },
        });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.errors?.username?.[0] ?? 'Registration failed');
    }
  };

  return (
    <AuthLayout
      title="Register as a seller"
      subtitle="Submit your shop details and start selling on PoultryLink"
      footer={
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            id="fullname"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="businessName" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Business Name
          </label>
          <input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Registering seller...' : 'Register as Seller'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SellerRegister;
