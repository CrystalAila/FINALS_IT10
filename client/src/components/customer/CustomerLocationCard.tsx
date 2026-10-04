import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Search,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
} from 'lucide-react';
import { useCustomerLocation } from '../../context/CustomerLocationContext';

// Customer Marker Icon with distinctive emerald green / brand styling
const customerPinIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
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

// Map click listener to allow adjusting the pin
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

// Map recentering helper
const MapViewSync: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

export const CustomerLocationCard: React.FC<{
  className?: string;
  onLocationChange?: (lat: number, lng: number) => void;
}> = ({ className = '', onLocationChange }) => {
  const {
    location,
    detectLocation,
    isDetecting,
    permissionError,
    clearError,
    clearLocation,
    updateLocationFromCoordinates,
  } = useCustomerLocation();

  // Default to Roxas City, Capiz
  const DEFAULT_LAT = 11.5853;
  const DEFAULT_LNG = 122.7511;

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Automatically expand map once a location is detected or chosen
  useEffect(() => {
    if (location) {
      setIsMapExpanded(true);
      if (onLocationChange) {
        onLocationChange(location.latitude, location.longitude);
      }
    }
  }, [location?.latitude, location?.longitude]);

  // Click outside to dismiss search dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleUseCurrentLocation = async () => {
    clearError();
    const detected = await detectLocation();
    if (detected) {
      setIsMapExpanded(true);
    }
  };

  const handleMapAdjust = async (lat: number, lng: number) => {
    const updated = await updateLocationFromCoordinates(lat, lng);
    if (onLocationChange) {
      onLocationChange(updated.latitude, updated.longitude);
    }
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualAddressInput.trim()) return;

    setIsSearchingManual(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          manualAddressInput
        )}&limit=5&countrycodes=ph`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Manual search error:', err);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    updateLocationFromCoordinates(lat, lng, result.display_name);
    setShowSearchResults(false);
    setManualAddressInput('');
    setIsMapExpanded(true);
  };

  const currentCenter: [number, number] = [
    location ? location.latitude : DEFAULT_LAT,
    location ? location.longitude : DEFAULT_LNG,
  ];

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card transition-all ${className}`}>
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-700 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Your Shopping Location</h3>
              {location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {location
                ? 'Your location is set! We can now detect and prioritize nearby poultry stores.'
                : 'Detect your location to discover nearby poultry farms and get fast local delivery.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetecting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use my current location
              </>
            )}
          </button>

          {location && (
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 transition cursor-pointer"
            >
              {isMapExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Map
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-[#D96B27]" />
                  Adjust Pin
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Permission Denied / Error Graceful Alert */}
      {permissionError && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <strong className="font-semibold block text-amber-900">Notice: Location access unavailable</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">{permissionError}</p>

              {/* Manual search input inside permission alert */}
              <div ref={searchContainerRef} className="relative mt-3">
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualAddressInput}
                      onChange={(e) => setManualAddressInput(e.target.value)}
                      placeholder="Type your street, barangay, or municipality manually..."
                      className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 pl-9 text-xs sm:text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingManual || !manualAddressInput.trim()}
                    className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSearchingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Address'}
                  </button>
                </form>

                {/* Dropdown Results for Manual Search */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-[1000] bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-green-50 hover:text-green-800 transition flex items-start gap-2"
                      >
                        <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-amber-500 hover:text-amber-700 p-1"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Search Bar (available anytime to search/refine) */}
      {!permissionError && !location && (
        <div ref={searchContainerRef} className="relative mt-4">
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualAddressInput}
                onChange={(e) => setManualAddressInput(e.target.value)}
                placeholder="Or enter your address / city manually..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-xs sm:text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={isSearchingManual || !manualAddressInput.trim()}
              className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isSearchingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-[1000] bg-white rounded-2xl shadow-xl border border-slate-200 max-h-52 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-orange-50 hover:text-[#D96B27] transition flex items-start gap-2.5"
                >
                  <MapPin className="h-4 w-4 text-[#D96B27] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Small Interactive Leaflet Map */}
      {isMapExpanded && (
        <div className="mt-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium flex items-center gap-1.5 text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-green-600" />
              Interactive Pin: Click anywhere on the map to fine-tune your location
            </span>
            <span className="text-[11px] text-slate-400">OpenStreetMap</span>
          </div>

          <div className="relative h-[220px] sm:h-[260px] w-full rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-0">
            <MapContainer
              center={currentCenter}
              zoom={location ? 15 : 13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={handleMapAdjust} />
              <MapViewSync center={currentCenter} zoom={location ? 15 : 13} />
              {location && (
                <Marker
                  position={[location.latitude, location.longitude]}
                  icon={customerPinIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleMapAdjust(position.lat, position.lng);
                    },
                  }}
                />
              )}
            </MapContainer>

            {/* Hint overlay */}
            <div className="absolute left-3 bottom-3 z-[400] pointer-events-none">
              <span className="rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
                👆 Click or drag marker to adjust
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Location Details Card below Map */}
      {location && (
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Pin Address
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words mt-0.5">
                {location.fullAddress}
              </p>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-500">
                <span>Lat: {location.latitude.toFixed(5)}</span>
                <span>•</span>
                <span>Lng: {location.longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={clearLocation}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition px-2.5 py-1.5 rounded-xl hover:bg-rose-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLocationCard;
