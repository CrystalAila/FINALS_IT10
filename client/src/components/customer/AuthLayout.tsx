import type { ReactNode } from 'react';
import Logo from './Logo';
import AuthLeftPanel from './AuthLeftPanel';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE: Exactly as user specified */}
      <AuthLeftPanel />

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
