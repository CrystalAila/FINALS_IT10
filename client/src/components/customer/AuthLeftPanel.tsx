import React from 'react';

export const AuthLeftPanel: React.FC = () => {
  return (
    <div
      className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden p-12 text-white select-none"
      style={{
        background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)',
      }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Layered Glassmorphism Outer Box */}
        <div className="flex items-center justify-center rounded-[36px] bg-white/15 p-6 backdrop-blur-md shadow-2xl shadow-black/10 border border-white/20">
          {/* Crisp White Inner Logo Box */}
          <div className="flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-[24px] bg-white p-5 shadow-lg shrink-0">
            <img
              src="/logo.png"
              alt="PoultryLink Logo"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name: Poultry (White) + Link (Orange) */}
        <h1 className="mt-8 text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
          Poultry<span className="text-[#D96B27]">Link</span>
        </h1>

        {/* Tagline: Exact punctuation and tracking */}
        <p className="mt-4 text-xs sm:text-sm font-bold tracking-[0.28em] text-[#D8EEDD] uppercase">
          FARM TO YOU. LINKED WITH CARE.
        </p>
      </div>
    </div>
  );
};

export default AuthLeftPanel;
