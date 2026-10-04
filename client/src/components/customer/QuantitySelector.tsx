import React from 'react';
import type { UnitType } from '../../types/marketplace';

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  unitType?: UnitType | string;
  step?: number;
  min?: number;
  max?: number;
};

export default function QuantitySelector({
  value,
  onChange,
  unitType = 'per_head',
  step,
  min,
  max = 999,
}: QuantitySelectorProps) {
  const isKilo = unitType === 'per_kilo';
  const effectiveStep = step ?? (isKilo ? 0.5 : 1);
  const effectiveMin = min ?? (isKilo ? 0.5 : 1);

  const handleDecrease = () => {
    const next = Math.max(effectiveMin, Number((value - effectiveStep).toFixed(2)));
    onChange(next);
  };

  const handleIncrease = () => {
    const next = Math.min(max, Number((value + effectiveStep).toFixed(2)));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (isNaN(raw)) return;
    if (isKilo) {
      onChange(Math.max(0.1, Number(raw.toFixed(2))));
    } else {
      onChange(Math.max(1, Math.floor(raw)));
    }
  };

  const getUnitSuffix = () => {
    switch (unitType) {
      case 'per_kilo':
        return 'kg';
      case 'per_head':
        return 'head';
      case 'per_tray':
        return 'tray';
      case 'per_piece':
        return 'pc';
      default:
        return '';
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= effectiveMin}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 font-bold text-base cursor-pointer"
        aria-label="Decrease quantity"
      >
        -
      </button>

      {isKilo ? (
        <div className="flex items-center justify-center px-1">
          <input
            type="number"
            min={effectiveMin}
            max={max}
            step={effectiveStep}
            value={value}
            onChange={handleInputChange}
            className="w-14 text-center font-bold text-slate-800 text-sm outline-none bg-transparent"
          />
          <span className="text-xs font-semibold text-slate-400 select-none mr-1">kg</span>
        </div>
      ) : (
        <div className="min-w-[2.5rem] text-center px-1">
          <span className="font-bold text-slate-800 text-sm">{value}</span>
          {getUnitSuffix() && (
            <span className="text-xs font-semibold text-slate-400 ml-1 select-none">
              {value > 1 ? `${getUnitSuffix()}s` : getUnitSuffix()}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleIncrease}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 font-bold text-base cursor-pointer"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
