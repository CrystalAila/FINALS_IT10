import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Product } from '../../types/marketplace';
import { formatUnitSuffix, priceRange, resolveProductImage } from '../../types/marketplace';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import { calculateDistanceKm, formatDistance } from '../../lib/geo';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { location: customerLocation } = useCustomerLocation();
  const farmName = product.farm?.name ?? 'Local Farm';
  const isVerified = product.farm?.permit_status === 'approved';
  const imageUrl = resolveProductImage(product.image, product.category);

  const distance =
    customerLocation && product.farm?.latitude && product.farm?.longitude
      ? calculateDistanceKm(
          customerLocation.latitude,
          customerLocation.longitude,
          Number(product.farm.latitude),
          Number(product.farm.longitude)
        )
      : null;

  const getCategoryLabel = (cat: string) => {
    if (cat === 'dressed_meat' || cat === 'dressed_chicken') return 'Dressed Meat';
    if (cat === 'live_poultry' || cat === 'broiler' || cat === 'native') return 'Live Poultry';
    if (cat === 'eggs') return 'Eggs';
    return cat.replace('_', ' ');
  };

  const handleFarmClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.farm_id) {
      navigate(`/customer/shops/${product.farm_id}`);
    }
  };

  return (
    <Link
      to={`/customer/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card border border-slate-100/90 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src = resolveProductImage(null, product.category);
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white capitalize">
          {getCategoryLabel(product.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-brand transition">
            {product.name}
          </h3>
          <div>
            <button
              onClick={handleFarmClick}
              className="text-sm font-medium text-slate-500 hover:text-brand transition hover:underline text-left inline-flex items-center gap-1.5 truncate max-w-full"
            >
              <span className="truncate">{farmName}</span>
              {isVerified && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                  Verified
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-base font-extrabold text-brand flex items-baseline gap-1">
            <span>{priceRange(product)}</span>
            <span className="text-xs font-semibold text-slate-500">
              {formatUnitSuffix(product.unit_type)}
            </span>
          </span>

          {distance !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100/80 shrink-0">
              <MapPin className="h-3 w-3" />
              {formatDistance(distance)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
