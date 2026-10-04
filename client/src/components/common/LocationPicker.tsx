import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';

// Custom Pin Icon using inline SVG (prevents broken 404 images from default Leaflet asset URLs)
const markerPinIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #D96B27 0%, #B34F14 100%);
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(217, 107, 39, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3.5" fill="#ffffff" />
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 5px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [38, 44],
  iconAnchor: [19, 44],
  popupAnchor: [0, -44],
});

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationSelected: (lat: number, lng: number) => void;
  disabled?: boolean;
}> = ({ onLocationSelected, disabled }) => {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to pan/zoom map when target coordinates change
const MapUpdater: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

export interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  fullAddress: string;
  onChange: (location: { latitude: number; longitude: number; fullAddress: string }) => void;
  readOnly?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  fullAddress,
  onChange,
  readOnly = false,
  label = 'Shop Location on Map',
  helperText = 'Search your location or click on the map to drop a pin.',
  className = '',
}) => {
  // Default to Roxas City, Capiz if coordinates are not set
  const DEFAULT_LAT = 11.5853;
  const DEFAULT_LNG = 122.7511;

  const currentLat = latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null;
  const currentLng = longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null;

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    currentLat ?? DEFAULT_LAT,
    currentLng ?? DEFAULT_LNG,
  ]);
  const [zoomLevel, setZoomLevel] = useState<number>(currentLat ? 16 : 13);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal center if coordinates prop change from outside
  useEffect(() => {
    if (currentLat !== null && currentLng !== null) {
      setMapCenter([currentLat, currentLng]);
      setZoomLevel(16);
    }
  }, [currentLat, currentLng]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse Geocoding with Nominatim (Lat/Lng -> Address)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onChange({
          latitude: parseFloat(lat.toFixed(7)),
          longitude: parseFloat(lng.toFixed(7)),
          fullAddress: address,
        });
      } else {
        onChange({
          latitude: parseFloat(lat.toFixed(7)),
          longitude: parseFloat(lng.toFixed(7)),
          fullAddress: fullAddress || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      onChange({
        latitude: parseFloat(lat.toFixed(7)),
        longitude: parseFloat(lng.toFixed(7)),
        fullAddress: fullAddress || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (readOnly) return;
    setMapCenter([lat, lng]);
    setZoomLevel(16);
    reverseGeocode(lat, lng);
  };

  // Search Address with Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || readOnly) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=ph`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Search geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select location from search dropdown
  const handleSelectResult = (item: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setMapCenter([lat, lng]);
    setZoomLevel(16);
    setShowResults(false);
    setSearchQuery('');
    onChange({
      latitude: parseFloat(lat.toFixed(7)),
      longitude: parseFloat(lng.toFixed(7)),
      fullAddress: item.display_name,
    });
  };

  // Use current browser location
  const handleUseCurrentLocation = () => {
    if (readOnly || !navigator.geolocation) return;
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        setZoomLevel(16);
        reverseGeocode(lat, lng);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            {label}
          </label>
          {helperText && !readOnly && (
            <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
          )}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D96B27] hover:text-[#B34F14] transition self-start sm:self-auto cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            Use My Current Location
          </button>
        )}
      </div>

      {/* Map Card */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Search Bar on top of map */}
        {!readOnly && (
          <div ref={searchContainerRef} className="relative p-2.5 bg-gray-50 border-b border-gray-100">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search street, barangay, or municipality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute left-2.5 right-2.5 top-full mt-1 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 max-h-56 overflow-y-auto divide-y divide-gray-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#D96B27] transition flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-[#D96B27] shrink-0" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
            {showResults && searchResults.length === 0 && !isSearching && (
              <div className="absolute left-2.5 right-2.5 top-full mt-1 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-500 text-center">
                No locations found. Try searching another landmark or street.
              </div>
            )}
          </div>
        )}

        {/* Leaflet Map */}
        <div className="relative h-[280px] sm:h-[320px] w-full z-0">
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelected={handleMapClick} disabled={readOnly} />
            <MapUpdater center={mapCenter} zoom={zoomLevel} />
            {currentLat !== null && currentLng !== null && (
              <Marker position={[currentLat, currentLng]} icon={markerPinIcon} />
            )}
          </MapContainer>

          {/* Interactive Hint Overlay */}
          {!readOnly && !currentLat && (
            <div className="absolute inset-x-4 top-3 z-[400] pointer-events-none">
              <div className="inline-block bg-white/95 backdrop-blur-sm border border-gray-200/80 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                👆 Click anywhere on the map to drop a pin
              </div>
            </div>
          )}

          {isGeocoding && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-[500]">
              <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-gray-200 flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#D96B27]" />
                Detecting address...
              </div>
            </div>
          )}
        </div>

        {/* Selected Address Display below the map */}
        <div className="p-3.5 sm:p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#D96B27] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Selected Shop Address
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 break-words mt-0.5">
                {fullAddress ? fullAddress : (
                  <span className="text-gray-400 font-normal italic">
                    {readOnly ? 'No location pinned' : 'No location pinned yet. Click on the map or search above.'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {currentLat !== null && currentLng !== null && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60 text-[11px] text-gray-500 font-mono">
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                <strong className="text-gray-700 font-sans">Lat:</strong> {currentLat.toFixed(7)}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                <strong className="text-gray-700 font-sans">Lng:</strong> {currentLng.toFixed(7)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
