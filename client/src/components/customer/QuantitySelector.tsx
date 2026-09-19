type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-2 py-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 font-bold text-base"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-[2rem] text-center font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 font-bold text-base"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
