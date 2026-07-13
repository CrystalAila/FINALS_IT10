import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/marketplace';
import { displayRating, formatPrice, priceRange } from '../../types/marketplace';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const farmName = product.farm?.name ?? 'Local Farm';
  const rating = displayRating(product.rating);

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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500">{farmName}</p>
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
