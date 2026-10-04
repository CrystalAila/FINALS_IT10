import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Store,
  Star,
  ExternalLink,
  Loader2,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import { calculateDistanceKm, formatDistance } from '../../lib/geo';
import api from '../../lib/axios';

// Customer Marker Icon (Green)
const customerMarkerIcon = L.divIcon({
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

// Farm / Store Marker Icon (Orange)
const storeMarkerIcon = L.divIcon({
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

const MapSync: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

export interface FarmShop {
  id: number;
  name: string;
  location?: string;
  full_address?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  rating?: number | string;
  logo?: string | null;
  description?: string;
  products_count?: number;
  distanceKm?: number | null;
}

export const StoreFinderMap: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const {
    location: customerLocation,
    detectLocation,
    isDetecting,
    updateLocationFromCoordinates,
  } = useCustomerLocation();

  const DEFAULT_LAT = 11.5853;
  const DEFAULT_LNG = 122.7511;

  const [shops, setShops] = useState<FarmShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  // Fetch approved shops
  useEffect(() => {
    const fetchShops = async () => {
      setLoadingShops(true);
      try {
        const res = await api.get('/shops');
        setShops(res.data.shops ?? []);
      } catch (err) {
        console.error('Failed to load shops for store finder:', err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  // Compute distances whenever customer location or shops list changes
  const shopsWithDistance: FarmShop[] = shops.map((shop) => {
    if (
      customerLocation &&
      shop.latitude !== null &&
      shop.latitude !== undefined &&
      shop.longitude !== null &&
      shop.longitude !== undefined
    ) {
      const dist = calculateDistanceKm(
        customerLocation.latitude,
        customerLocation.longitude,
        Number(shop.latitude),
        Number(shop.longitude)
      );
      return { ...shop, distanceKm: dist };
    }
    return { ...shop, distanceKm: null };
  });

  // Sort: shops with known distance first (ascending), then the rest
  const sortedShops = [...shopsWithDistance].sort((a, b) => {
    const distA = a.distanceKm != null ? a.distanceKm : Infinity;
    const distB = b.distanceKm != null ? b.distanceKm : Infinity;
    if (distA !== Infinity || distB !== Infinity) {
      return distA - distB;
    }
    return a.name.localeCompare(b.name);
  });

  const mapCenter: [number, number] = customerLocation
    ? [customerLocation.latitude, customerLocation.longitude]
    : [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-card ${className}`}>
      {/* Top action header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 text-[#D96B27]">
              <Store className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Poultry Store Finder</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Locate approved poultry farms in Capiz. Click anywhere on the map to adjust your location pin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => detectLocation()}
          disabled={isDetecting}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Use my current location
            </>
          )}
        </button>
      </div>

      {/* Main Map + Nearby Stores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Interactive Map */}
        <div className="lg:col-span-8 relative h-[320px] sm:h-[400px] w-full z-0">
          <MapContainer
            center={mapCenter}
            zoom={customerLocation ? 13 : 12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler
              onSelect={(lat, lng) => updateLocationFromCoordinates(lat, lng)}
            />
            <MapSync center={mapCenter} zoom={customerLocation ? 13 : 12} />

            {/* Customer Pin */}
            {customerLocation && (
              <Marker
                position={[customerLocation.latitude, customerLocation.longitude]}
                icon={customerMarkerIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    updateLocationFromCoordinates(pos.lat, pos.lng);
                  },
                }}
              >
                <Popup>
                  <div className="p-1">
                    <strong className="text-emerald-700 block text-xs font-bold uppercase">
                      Your Pinned Location
                    </strong>
                    <p className="text-xs text-slate-700 mt-1 break-words">
                      {customerLocation.fullAddress}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Drag or click anywhere to adjust
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Farm Store Pins */}
            {shopsWithDistance.map((shop) => {
              if (!shop.latitude || !shop.longitude) return null;
              const lat = Number(shop.latitude);
              const lng = Number(shop.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker key={shop.id} position={[lat, lng]} icon={storeMarkerIcon}>
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <span className="text-[10px] font-bold uppercase text-orange-600 tracking-wider">
                        Poultry Farm
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                        {shop.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {shop.full_address || shop.location}
                      </p>

                      {shop.distanceKm != null && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(shop.distanceKm)}
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <Link
                          to={`/customer/shops/${shop.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D96B27] hover:underline"
                        >
                          Visit Store <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Legend Floating Tag */}
          <div className="absolute left-3 bottom-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-2.5 shadow-md flex items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block border border-white"></span>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D96B27] inline-block border border-white"></span>
              <span>Poultry Farms</span>
            </div>
          </div>
        </div>

        {/* Nearby Stores Side List */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col h-[320px] sm:h-[400px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nearby Stores ({sortedShops.length})
            </span>
            {customerLocation && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                Sorted by distance
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {loadingShops && (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#D96B27]" />
                Loading poultry stores...
              </div>
            )}

            {!loadingShops && sortedShops.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No approved farm stores registered yet.
              </div>
            )}

            {!loadingShops &&
              sortedShops.map((shop) => (
                <div
                  key={shop.id}
                  className={`p-3 rounded-2xl transition hover:bg-orange-50/50 flex flex-col gap-1.5 ${
                    selectedShopId === shop.id ? 'bg-orange-50/80 border border-orange-200' : ''
                  }`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{shop.name}</h5>
                    {shop.distanceKm != null ? (
                      <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {formatDistance(shop.distanceKm)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] text-slate-400 font-medium">
                        Capiz
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {shop.full_address || shop.location || 'Local farm in Capiz'}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(shop.rating || 5).toFixed(1)}</span>
                      {shop.products_count !== undefined && (
                        <span className="text-slate-400 font-normal ml-1">
                          • {shop.products_count} {shop.products_count === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/customer/shops/${shop.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#D96B27] hover:underline"
                    >
                      Shop <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreFinderMap;
