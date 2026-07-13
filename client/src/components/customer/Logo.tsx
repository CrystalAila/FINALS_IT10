import { Link } from 'react-router-dom';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
};

const sizes = {
  sm: { icon: 'text-xl', text: 'text-lg' },
  md: { icon: 'text-2xl', text: 'text-xl' },
  lg: { icon: 'text-3xl', text: 'text-2xl' },
};

export default function Logo({ size = 'md', light = false }: LogoProps) {
  const s = sizes[size];
  return (
    <Link to="/customer" className="flex items-center gap-2.5">
      <span
        className={`${s.icon} flex h-10 w-10 items-center justify-center rounded-xl ${
          light ? 'bg-white/15' : 'bg-brand/10'
        }`}
      >
        🐔
      </span>
      <span className={`${s.text} font-bold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>
        Poultry<span className="text-brand">Link</span>
      </span>
    </Link>
  );
}
