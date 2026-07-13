import type { ReactNode } from 'react';
import Logo from './Logo';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-login-green p-12 text-white lg:flex">
        <Logo light size="lg" />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Fresh Poultry,<br />
            <span className="text-brand-light">Delivered Fresh</span>
          </h1>
          <p className="max-w-sm text-green-100">
            Capiz&apos;s trusted marketplace connecting local farms with customers across the region.
          </p>
        </div>
        <p className="text-sm text-green-300">© 2026 PoultryLink. All rights reserved.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-gray-500">{subtitle}</p>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}
