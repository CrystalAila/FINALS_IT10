import { Link } from 'react-router-dom';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
  to?: string;
};

const sizes = {
  sm: { box: 'h-8 w-8', text: 'text-lg' },
  md: { box: 'h-10 w-10', text: 'text-xl' },
  lg: { box: 'h-14 w-14', text: 'text-2xl' },
};

export default function Logo({ size = 'md', light = false, to = '/customer' }: LogoProps) {
  const s = sizes[size];
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <div
        className={`flex items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/50 shrink-0 overflow-hidden ${s.box}`}
      >
        <img
          src="/logo.png"
          alt="PoultryLink Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <span className={`${s.text} font-bold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>
        Poultry<span className="text-brand">Link</span>
      </span>
    </Link>
  );
}
