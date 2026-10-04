import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Store, ExternalLink } from 'lucide-react';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import { calculateDistanceKm, formatDistance } from '../../lib/geo';

// Seller / Farm Store Marker Icon (Brand Orange)
const sellerPinIcon = L.divIcon({
  className: 'custom-seller-marker',
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
        box-shadow: 0 4px 12px rgba(217, 107, 39, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 17px; height: 17px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

// Customer Pin Icon (Emerald Green)
const customerPinIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(22, 163, 74, 0.4);
        border: 2px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" fill="#ffffff" />
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 3px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [30, 34],
  iconAnchor: [15, 34],
  popupAnchor: [0, -34],
});

// Component to handle auto-recentering or fitting bounds
const MapBoundsAdjuster: React.FC<{
  sellerCoords: [number, number];
  customerCoords?: [number, number] | null;
}> = ({ sellerCoords, customerCoords }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (customerCoords) {
      const bounds = L.latLngBounds([sellerCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(sellerCoords, 14);
    }
  }, [sellerCoords[0], sellerCoords[1], customerCoords?.[0], customerCoords?.[1], map]);

  return null;
};

export interface SellerLocationMapProps {
  name: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  fullAddress?: string | null;
  location?: string | null;
  className?: string;
  cardTitle?: string;
}

export const SellerLocationMap: React.FC<SellerLocationMapProps> = ({
  name,
  latitude,
  longitude,
  fullAddress,
  location,
  className = '',
  cardTitle = 'Seller Location',
}) => {
  const { location: customerLocation, detectLocation, isDetecting } = useCustomerLocation();

  const sellerLat = latitude !== null && latitude !== undefined && latitude !== '' ? Number(latitude) : null;
  const sellerLng = longitude !== null && longitude !== undefined && longitude !== '' ? Number(longitude) : null;
  const hasCoordinates = sellerLat !== null && sellerLng !== null && !isNaN(sellerLat) && !isNaN(sellerLng);

  // Address resolution
  const resolvedAddress = fullAddress || location || 'Roxas City, Capiz, Philippines';

  // Calculate distance from customer if customer location is available
  const distance =
    customerLocation && hasCoordinates
      ? calculateDistanceKm(customerLocation.latitude, customerLocation.longitude, sellerLat, sellerLng)
      : null;

  const sellerCoords: [number, number] = hasCoordinates
    ? [sellerLat, sellerLng]
    : [11.5853, 122.7511]; // default Roxas City fallback

  const customerCoords: [number, number] | null =
    customerLocation && hasCoordinates
      ? [customerLocation.latitude, customerLocation.longitude]
      : null;

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-card ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-100 text-[#D96B27] shrink-0">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{cardTitle}</h3>
            <span className="text-xs text-slate-500 font-medium">{name}</span>
          </div>
        </div>

        {/* Distance Badge or Detect Button */}
        {distance !== null ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100/90 self-start sm:self-auto shrink-0 shadow-xs">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span>{formatDistance(distance)} from your location</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => detectLocation()}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Navigation className="h-3.5 w-3.5 text-[#D96B27]" />
            {isDetecting ? 'Detecting...' : 'Calculate distance from me'}
          </button>
        )}
      </div>

      {/* Small Interactive Leaflet Map */}
      {hasCoordinates ? (
        <div className="relative h-[200px] sm:h-[230px] w-full z-0">
          <MapContainer
            center={sellerCoords}
            zoom={14}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsAdjuster sellerCoords={sellerCoords} customerCoords={customerCoords} />

            {/* Seller Marker */}
            <Marker position={sellerCoords} icon={sellerPinIcon}>
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <span className="text-[10px] font-bold uppercase text-[#D96B27] tracking-wider block">
                    Seller Location
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{resolvedAddress}</p>
                  {distance !== null && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(distance)}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Customer Marker (if available) */}
            {customerCoords && (
              <Marker position={customerCoords} icon={customerPinIcon}>
                <Popup>
                  <div className="p-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block">
                      Your Pinned Location
                    </span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {customerLocation?.fullAddress || 'Customer Location'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute left-2.5 bottom-2.5 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-3 text-[11px] font-medium text-slate-700">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D96B27] inline-block border border-white"></span>
              <span>Shop Pin</span>
            </div>
            {customerCoords && (
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block border border-white"></span>
                <span>You</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center">
          <p className="text-xs text-slate-500 italic">
            Exact map coordinates not yet configured by the seller.
          </p>
        </div>
      )}

      {/* Address & Coordinates Info Bar below map */}
      <div className="p-4 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin className="h-4 w-4 text-[#D96B27] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Full Address
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words mt-0.5">
              {resolvedAddress}
            </p>
          </div>
        </div>

        {hasCoordinates && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 shrink-0 self-end sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span>Lat: {Number(sellerLat).toFixed(5)}</span>
            <span>•</span>
            <span>Lng: {Number(sellerLng).toFixed(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerLocationMap;
