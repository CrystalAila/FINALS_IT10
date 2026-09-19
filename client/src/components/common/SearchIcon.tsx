import React from 'react';

interface SearchIconProps {
  className?: string;
}

export const SearchIcon: React.FC<SearchIconProps> = ({ className = 'h-4 w-4 text-slate-400' }) => {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
      />
    </svg>
  );
};

export default SearchIcon;
