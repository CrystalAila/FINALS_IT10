import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import {
  Navigation,
  MapPin,
  Store,
  Star,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import api from '../../lib/axios';

// Customer Marker Icon (Emerald Green)
const customerPinIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3.5" fill="#ffffff" />
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 5px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [38, 42],
  iconAnchor: [19, 42],
  popupAnchor: [0, -42],
});

// Store Marker Icon (Brand Orange)
const storePinIcon = L.divIcon({
  className: 'custom-store-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #D96B27 0%, #B34F14 100%);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(217, 107, 39, 0.4);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 17px; height: 17px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 4px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [36, 40],
  iconAnchor: [18, 40],
  popupAnchor: [0, -40],
});

// Map View Sync Component
const MapViewSync: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] && center[1]) {
      map.flyTo(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Map click listener to allow adjusting customer location on map
const MapClickHandler: React.FC<{
  onSelect: (lat: number, lng: number) => void;
}> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export interface NearbyStore {
  id: number;
  name: string;
  distance: number;
  distance_km: number;
  distance_formatted: string;
  address: string;
  full_address?: string;
  location?: string;
  latitude: string | number;
  longitude: string | number;
  rating?: string | number;
  logo?: string | null;
  description?: string;
  products_count?: number;
}

export const StoresNearMe: React.FC<{
  className?: string;
  title?: string;
  subtitle?: string;
}> = ({
  className = '',
  title = 'Stores Near Me',
  subtitle = 'Find local poultry raisers and egg suppliers in your area.',
}) => {
  const {
    location: customerLocation,
    detectLocation,
    isDetecting,
    updateLocationFromCoordinates,
  } = useCustomerLocation();

  const DEFAULT_LAT = 11.5853;
  const DEFAULT_LNG = 122.7511;

  const [radius, setRadius] = useState<number>(10); // default 10 km
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Active customer coordinates (fallback to default Roxas City center if not set)
  const activeLat = customerLocation ? customerLocation.latitude : DEFAULT_LAT;
  const activeLng = customerLocation ? customerLocation.longitude : DEFAULT_LNG;

  // Fetch nearby stores from backend API
  const fetchNearbyStores = async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/stores/nearby', {
        params: {
          lat,
          lng,
          radius: rad,
        },
      });

      const list: NearbyStore[] = res.data.stores || res.data.shops || [];
      setStores(list);
    } catch (err: any) {
      console.error('Failed to fetch nearby stores:', err);
      setError('Unable to load nearby stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when customer coordinates or radius change
  useEffect(() => {
    fetchNearbyStores(activeLat, activeLng, radius);
  }, [activeLat, activeLng, radius]);

  const handleAdjustLocation = (lat: number, lng: number) => {
    updateLocationFromCoordinates(lat, lng);
  };

  const handleSelectStore = (store: NearbyStore) => {
    setSelectedStoreId(store.id);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner & Location Status */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-[#D96B27]">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
              </div>
            </div>

            {/* Current Detected Address */}
            <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Your Location:</span>
              <span className="text-slate-800 font-semibold truncate max-w-md">
                {customerLocation ? customerLocation.fullAddress : 'Default (Roxas City, Capiz)'}
              </span>
            </div>
          </div>

          {/* Action Controls: Use My Location & Radius Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => detectLocation()}
              disabled={isDetecting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting GPS...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Use my current location
                </>
              )}
            </button>

            {/* Radius Options */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 px-2.5 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Radius:
              </span>
              {[5, 10, 20, 50].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    radius === r
                      ? 'bg-white text-[#D96B27] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Leaflet Map & Nearby Stores List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map (8 cols on large screen) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Compass className="h-4 w-4 text-[#D96B27]" />
              Interactive Store Map (Within {radius} km radius)
            </div>
            <span className="text-[11px] text-slate-400">
              Click anywhere to reposition your pin
            </span>
          </div>

          <div className="relative h-[380px] sm:h-[480px] w-full z-0">
            <MapContainer
              center={[activeLat, activeLng]}
              zoom={radius <= 10 ? 13 : radius <= 25 ? 12 : 11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={handleAdjustLocation} />
              <MapViewSync
                center={[activeLat, activeLng]}
                zoom={radius <= 10 ? 13 : radius <= 25 ? 12 : 11}
              />

              {/* Radius Circle around customer */}
              <Circle
                center={[activeLat, activeLng]}
                radius={radius * 1000}
                pathOptions={{
                  color: '#D96B27',
                  fillColor: '#D96B27',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4, 6',
                }}
              />

              {/* Customer Pin */}
              <Marker
                position={[activeLat, activeLng]}
                icon={customerPinIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    handleAdjustLocation(pos.lat, pos.lng);
                  },
                }}
              >
                <Popup>
                  <div className="p-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block">
                      Your Location
                    </span>
                    <p className="text-xs text-slate-800 font-semibold mt-1">
                      {customerLocation?.fullAddress || 'Roxas City, Capiz'}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Searching stores within {radius} km
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Store Pins */}
              {stores.map((store) => {
                const lat = Number(store.latitude);
                const lng = Number(store.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker
                    key={store.id}
                    position={[lat, lng]}
                    icon={storePinIcon}
                    eventHandlers={{
                      click: () => handleSelectStore(store),
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-[220px]">
                        <span className="text-[10px] font-bold uppercase text-[#D96B27] tracking-wider block">
                          Poultry Store
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {store.name}
                        </h4>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <MapPin className="h-3 w-3" />
                          {store.distance_formatted || `${store.distance} km away`}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {store.address}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                          <Link
                            to={`/customer/shops/${store.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#D96B27] text-white px-2.5 py-1 text-xs font-semibold hover:bg-[#C55A1A] transition"
                          >
                            View Shop <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute left-3 bottom-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-2.5 shadow-md flex items-center gap-3.5 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-white"></span>
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D96B27] inline-block border border-white"></span>
                <span>Nearby Stores ({stores.length})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Cards List (4 cols on large screen, sorted by nearest first) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Nearby Stores ({stores.length})
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Sorted Nearest First
            </span>
          </div>

          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 shadow-card">
              <Loader2 className="h-6 w-6 animate-spin text-[#D96B27]" />
              <span className="text-sm font-medium">Finding nearby poultry stores...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchNearbyStores(activeLat, activeLng, radius)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && stores.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#D96B27]">
                <Store className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">No stores found within {radius} km</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                There are no poultry shops registered within {radius} km of your pin. Try expanding your search radius.
              </p>
              <button
                type="button"
                onClick={() => setRadius(radius === 5 ? 10 : radius === 10 ? 20 : 50)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-[#D96B27] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C55A1A] transition shadow-sm cursor-pointer"
              >
                Expand Radius to {radius === 5 ? '10 km' : radius === 10 ? '20 km' : '50 km'}
              </button>
            </div>
          )}

          {/* Sorted Stores List */}
          {!loading &&
            stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className={`rounded-3xl border bg-white p-5 shadow-card transition-all hover:border-orange-300 hover:shadow-lg flex flex-col justify-between gap-3 cursor-pointer ${
                  selectedStoreId === store.id
                    ? 'border-[#D96B27] ring-2 ring-orange-200/60'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Shop Name & Distance */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-base line-clamp-1">
                      {store.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-500 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(store.rating || 5).toFixed(1)}</span>
                      {store.products_count !== undefined && (
                        <span className="text-slate-400 font-normal ml-1">
                          • {store.products_count} {store.products_count === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Distance (e.g. 1.2 km away) */}
                  <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{store.distance_formatted || `${store.distance} km away`}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <p className="line-clamp-2 leading-relaxed break-words">
                    {store.address || 'Roxas City, Capiz'}
                  </p>
                </div>

                {/* Button to view shop */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Verified Seller
                  </span>

                  <Link
                    to={`/customer/shops/${store.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                  >
                    View Shop
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StoresNearMe;
