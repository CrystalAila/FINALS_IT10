import { Star, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../../types/marketplace';
import { displayRating, formatPrice, priceRange } from '../../types/marketplace';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const farmName = product.farm?.name ?? 'Local Farm';
  const rating = displayRating(product.rating);
  const isVerified = product.farm?.permit_status === 'approved';

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
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.image ?? 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400'}
          alt={product.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/60 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white capitalize">
          {product.category === 'dressed_chicken' ? 'Dressed Chicken' : product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-gray-900">{product.name}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFarmClick}
            className="text-sm text-gray-500 hover:text-brand transition hover:underline text-left font-medium flex items-center gap-1"
          >
            {farmName}
            {isVerified && <CheckCircle className="h-3.5 w-3.5 fill-emerald-500 text-white" />}
          </button>
        </div>
        {product.farm_origin && (
          <p className="text-xs text-slate-400 truncate">
            Origin: <span className="font-semibold text-slate-500">{product.farm_origin}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-brand">{priceRange(product)}</span>
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {rating}
          </span>
        </div>
        <p className="text-xs text-gray-400">From {formatPrice(Number(product.price_medium))}</p>
      </div>
    </Link>
  );
}
