import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import ProductCard from '../../components/customer/ProductCard';
import type { Farm, Product } from '../../types/marketplace';
import { displayRating } from '../../types/marketplace';

export default function ShopDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/farms/${id}`);
        setFarm(res.data.farm);
        setProducts(res.data.products ?? []);
        setIsFavorited(res.data.is_favorited ?? false);
      } catch (err) {
        console.error('Failed to load shop details:', err);
        setError('Failed to load shop details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchShopDetails();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (toggling || !farm) return;
    setToggling(true);
    try {
      const res = await api.post(`/farms/${farm.id}/favorite`);
      setIsFavorited(res.data.favorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/60" />;
  }

  if (error || !farm) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-card">
        <p className="text-gray-500">{error || 'Shop details not found.'}</p>
        <Link to="/customer" className="mt-4 inline-block text-brand hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const isVerified = farm.permit_status === 'approved';
  const isExpired = farm.is_permit_expired;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/customer"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </div>

      {/* Shop Profile Banner */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* Shop Logo Placeholder */}
          <div className="h-20 w-20 rounded-3xl bg-brand/10 text-brand text-4xl flex items-center justify-center border border-brand/20 select-none shadow-inner shrink-0">
            {farm.logo ? (
              <img src={farm.logo} alt={farm.name} className="h-full w-full object-cover rounded-3xl" />
            ) : (
              '🏡'
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 leading-none">{farm.name}</h1>
              {isVerified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                  <CheckCircle className="h-3 w-3 fill-emerald-500 text-white" />
                  Verified
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-100">
                  <AlertTriangle className="h-3 w-3 text-rose-500" />
                  Permit Expired
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-4 w-4 text-slate-400" />
                {farm.location || 'Capiz, Philippines'}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {displayRating(farm.rating ?? 5.0)} rating
              </span>
            </div>
            
            <p className="text-sm text-slate-600 max-w-xl">{farm.description}</p>
          </div>
        </div>

        {/* Favorite shop Action */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={toggling}
          className={`w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold border transition shadow-sm ${
            isFavorited
              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
          {isFavorited ? 'Shop Favorited' : 'Favorite Shop'}
        </button>
      </section>

      {/* Shop Products */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products from this Shop</h2>
          <p className="text-sm text-slate-500 mt-1">Browse all available listings currently offered by {farm.name}</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white text-slate-500">
            This shop has no active product listings at the moment.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
