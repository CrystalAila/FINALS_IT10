import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  ArrowLeft,
  Check,
  AlertCircle,
  Building,
  Phone,
  User,
  FileText,
  Compass,
  ChevronRight,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import type { SavedAddress } from '../../types/marketplace';

// Custom Pin Icon for Leaflet Map with Foodpanda / Capiz branding
const foodpandaPinIcon = L.divIcon({
  className: 'custom-foodpanda-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #E27638 0%, #D96B27 100%);
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px rgba(217, 107, 39, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
        background: rgba(0, 0, 0, 0.28);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [38, 44],
  iconAnchor: [19, 44],
  popupAnchor: [0, -44],
});

// Map click listener to adjust the pin position
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

// Map recentering controller
const MapViewSync: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] && center[1]) {
      map.flyTo(center, zoom || 16, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Capiz Municipalities with preset center coordinates and postal codes
export const CAPIZ_MUNICIPALITIES: Array<{
  name: string;
  postalCode: string;
  lat: number;
  lng: number;
}> = [
  { name: 'Roxas City', postalCode: '5800', lat: 11.5853, lng: 122.7511 },
  { name: 'Cuartero', postalCode: '5811', lat: 11.3167, lng: 122.6833 },
  { name: 'Dao', postalCode: '5810', lat: 11.3933, lng: 122.6842 },
  { name: 'Dumalag', postalCode: '5813', lat: 11.3000, lng: 122.6167 },
  { name: 'Dumarao', postalCode: '5812', lat: 11.2667, lng: 122.6833 },
  { name: 'Ivisan', postalCode: '5805', lat: 11.5200, lng: 122.7000 },
  { name: 'Jamindan', postalCode: '5808', lat: 11.4500, lng: 122.4833 },
  { name: 'Maayon', postalCode: '5809', lat: 11.3833, lng: 122.7833 },
  { name: 'Mambusao', postalCode: '5807', lat: 11.4333, lng: 122.6000 },
  { name: 'Panay', postalCode: '5801', lat: 11.5500, lng: 122.7833 },
  { name: 'Panitan', postalCode: '5815', lat: 11.4667, lng: 122.7500 },
  { name: 'Pilar', postalCode: '5804', lat: 11.4833, lng: 122.9833 },
  { name: 'Pontevedra', postalCode: '5802', lat: 11.4333, lng: 122.8333 },
  { name: 'President Roxas', postalCode: '5803', lat: 11.4333, lng: 122.9333 },
  { name: 'Sapi-an', postalCode: '5806', lat: 11.5333, lng: 122.6000 },
  { name: 'Sigma', postalCode: '5816', lat: 11.4167, lng: 122.6667 },
  { name: 'Tapaz', postalCode: '5814', lat: 11.2667, lng: 122.5333 },
];

export interface FoodpandaAddressModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (savedAddress: SavedAddress) => void;
  editingAddress?: SavedAddress | null;
  defaultFullName?: string;
}

export const FoodpandaAddressModal: React.FC<FoodpandaAddressModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingAddress = null,
  defaultFullName = '',
}) => {
  const { toast } = useToast();
  const { location: globalLocation, setLocation: setGlobalLocation } = useCustomerLocation();

  // Step 1: Map Pinning | Step 2: Address Details
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Pin coordinates (default to Roxas City center if nothing set)
  const [pinnedLat, setPinnedLat] = useState<number>(11.5853);
  const [pinnedLng, setPinnedLng] = useState<number>(122.7511);
  const [hasPinned, setHasPinned] = useState<boolean>(false);
  const [detectedAddressText, setDetectedAddressText] = useState<string>('');
  const [isDetectingCurrent, setIsDetectingCurrent] = useState(false);

  // Search input & results for Step 1
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Step 2 Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('Roxas City');
  const [postalCode, setPostalCode] = useState('5800');
  const [streetAddress, setStreetAddress] = useState('');
  const [floorUnit, setFloorUnit] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or reset modal state whenever opened
  useEffect(() => {
    if (!open) return;

    if (editingAddress) {
      // Editing existing address
      const lat = editingAddress.latitude ? Number(editingAddress.latitude) : 11.5853;
      const lng = editingAddress.longitude ? Number(editingAddress.longitude) : 122.7511;
      setPinnedLat(lat);
      setPinnedLng(lng);
      setHasPinned(Boolean(editingAddress.latitude && editingAddress.longitude));
      setDetectedAddressText(editingAddress.street_address || '');

      setFullName(editingAddress.full_name || '');
      setPhone(editingAddress.phone || '');
      setRegion(editingAddress.region || 'Roxas City');
      setPostalCode(editingAddress.postal_code || '5800');
      setStreetAddress(editingAddress.street_address || '');
      setFloorUnit(editingAddress.floor_unit || '');
      setDeliveryNotes(editingAddress.delivery_notes || '');
      setIsDefault(Boolean(editingAddress.is_default));
      
      // If address already had coordinates, start on Step 2 with easy option to view/adjust pin
      setCurrentStep(editingAddress.latitude ? 2 : 1);
    } else {
      // New Address - Foodpanda style: always start on Step 1 (Map)
      setCurrentStep(1);
      const initLat = globalLocation?.latitude ?? 11.5853;
      const initLng = globalLocation?.longitude ?? 122.7511;
      setPinnedLat(initLat);
      setPinnedLng(initLng);
      setHasPinned(Boolean(globalLocation?.latitude));
      setDetectedAddressText(globalLocation?.fullAddress || '');

      setFullName(defaultFullName);
      setPhone('');
      setRegion('Roxas City');
      setPostalCode('5800');
      setStreetAddress('');
      setFloorUnit('');
      setDeliveryNotes('');
      setIsDefault(false);
    }
  }, [open, editingAddress, defaultFullName, globalLocation]);

  // Click outside to dismiss search results dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Reverse geocode pinned coordinates to assist user
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const fullAddr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setDetectedAddressText(fullAddr);

        // Auto-fill municipality if recognized
        const addrObj = data.address || {};
        const cityCandidate = addrObj.city || addrObj.town || addrObj.municipality || addrObj.county || '';
        const matchMuni = CAPIZ_MUNICIPALITIES.find((m) =>
          cityCandidate.toLowerCase().includes(m.name.toLowerCase()) ||
          fullAddr.toLowerCase().includes(m.name.toLowerCase())
        );
        if (matchMuni) {
          setRegion(matchMuni.name);
          setPostalCode(matchMuni.postalCode);
        }

        // If street address is currently empty, prefill with road / suburb
        if (!streetAddress) {
          const road = addrObj.road || addrObj.neighbourhood || addrObj.suburb || '';
          if (road) {
            setStreetAddress(road);
          }
        }
      }
    } catch {
      setDetectedAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // Adjust pin position on click or drag
  const handlePinChange = (lat: number, lng: number) => {
    setPinnedLat(lat);
    setPinnedLng(lng);
    setHasPinned(true);
    reverseGeocode(lat, lng);
  };

  // "Use my current location" GPS detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handlePinChange(lat, lng);
        setIsDetectingCurrent(false);
        toast.success('Current location detected! Pin updated.');
      },
      (error) => {
        setIsDetectingCurrent(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission was denied. You can manually tap anywhere on the map to drop your pin.');
        } else {
          toast.error('Could not detect location. Please select your location on the map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Search places via Nominatim
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          searchQuery + ', Capiz, Philippines'
        )}&limit=5&countrycodes=ph`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Location search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handlePinChange(lat, lng);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Jump map to a specific Capiz municipality
  const handleJumpToMunicipality = (muniName: string) => {
    const muni = CAPIZ_MUNICIPALITIES.find((m) => m.name === muniName);
    if (muni) {
      handlePinChange(muni.lat, muni.lng);
      setRegion(muni.name);
      setPostalCode(muni.postalCode);
    }
  };

  // Submit Step 2 form to API
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim()) {
      toast.error('Please enter your street address or house number.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter a contact phone number for the rider.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim() || 'Customer',
        phone: phone.trim(),
        region: region.trim(),
        postal_code: postalCode.trim() || '5800',
        street_address: streetAddress.trim(),
        floor_unit: floorUnit.trim() || null,
        delivery_notes: deliveryNotes.trim() || null,
        latitude: pinnedLat,
        longitude: pinnedLng,
        is_default: isDefault,
      };

      let saved: SavedAddress;
      if (editingAddress?.id) {
        const res = await api.put(`/addresses/${editingAddress.id}`, payload);
        saved = res.data.address;
        toast.success('Address updated successfully!');
      } else {
        const res = await api.post('/addresses', payload);
        saved = res.data.address;
        toast.success('Delivery address saved successfully!');
      }

      // Sync global customer location with default address
      if (saved.is_default || !globalLocation) {
        setGlobalLocation({
          latitude: Number(saved.latitude),
          longitude: Number(saved.longitude),
          fullAddress: `${saved.street_address}, ${saved.region}`,
          source: 'map_pin',
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? 'Failed to save address. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Back to Map Pinning"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D96B27] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  Step {currentStep} of 2
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">
                  {currentStep === 1 ? 'Pin Location on Map' : 'Complete Delivery Address'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {editingAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* ========================================================= */}
          {/* STEP 1: FOODPANDA-STYLE MAP PINNING                        */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="text-xs leading-relaxed text-amber-900">
                  <span className="font-semibold block text-sm">Where should the rider deliver?</span>
                  Click or drag the pin directly over your house, building entrance, or gate. Your rider will navigate to this exact pin!
                </div>
              </div>

              {/* Search bar & Current location button */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div ref={searchContainerRef} className="relative flex-1">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search street, barangay, or landmark in Capiz..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:bg-white focus:ring-2 focus:ring-[#D96B27]/20 transition"
                    />
                    <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    {isSearching && (
                      <Loader2 className="h-4 w-4 text-[#D96B27] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </form>

                  {/* Autocomplete Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-[1000] bg-white rounded-2xl shadow-xl border border-slate-200 max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-orange-50 hover:text-[#D96B27] transition flex items-start gap-2.5 cursor-pointer"
                        >
                          <MapPin className="h-4 w-4 text-[#D96B27] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingCurrent}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 cursor-pointer shrink-0"
                >
                  {isDetectingCurrent ? (
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

              {/* Quick Municipality Jump Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick jump to municipality:
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CAPIZ_MUNICIPALITIES.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleJumpToMunicipality(m.name)}
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                        region === m.name
                          ? 'bg-orange-100/80 text-[#D96B27] border-[#D96B27]/40 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Leaflet Map Container */}
              <div className="relative h-[290px] sm:h-[340px] w-full rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-0">
                <MapContainer
                  center={[pinnedLat, pinnedLng]}
                  zoom={16}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onSelect={handlePinChange} />
                  <MapViewSync center={[pinnedLat, pinnedLng]} zoom={16} />
                  <Marker
                    position={[pinnedLat, pinnedLng]}
                    icon={foodpandaPinIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const pos = marker.getLatLng();
                        handlePinChange(pos.lat, pos.lng);
                      },
                    }}
                  />
                </MapContainer>

                {/* Map Floating Badges */}
                <div className="absolute left-3 bottom-3 z-[400] pointer-events-none">
                  <span className="rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tap or drag pin to adjust delivery point
                  </span>
                </div>
              </div>

              {/* Pinned Coordinates Info Box */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-orange-100 text-[#D96B27] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pinned Delivery Location
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words mt-0.5">
                    {detectedAddressText || `${pinnedLat.toFixed(5)}, ${pinnedLng.toFixed(5)}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                    <span>Lat: {pinnedLat.toFixed(5)}</span>
                    <span>•</span>
                    <span>Lng: {pinnedLng.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Proceed to Step 2 */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3.5 px-6 text-sm font-bold text-white shadow-md transition cursor-pointer"
              >
                <span>Confirm Location & Enter Address Details</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: ADDRESS DETAILS FORM (FOODPANDA STYLE)             */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Pinned Location Recap with Adjust Button */}
              <div className="rounded-2xl bg-orange-50/70 border border-orange-200/80 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-orange-100 text-[#D96B27] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-orange-950">Pinned Delivery Location</div>
                    <div className="text-orange-800 truncate font-medium">
                      {region} • {pinnedLat.toFixed(4)}, {pinnedLng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-orange-300 bg-white hover:bg-orange-100/50 px-3 py-1.5 text-xs font-bold text-[#D96B27] transition cursor-pointer shrink-0"
                >
                  Adjust Pin
                </button>
              </div>

              {/* Mandatory Foodpanda Notice */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">
                  <strong>Important:</strong> Your rider will deliver to the pinned location. Please provide accurate house/building details below.
                </span>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person (Full Name) *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-9 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                    />
                    <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0917 123 4567"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-9 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                    />
                    <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Municipality & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Municipality (Capiz only) *
                  </label>
                  <select
                    required
                    value={region}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setRegion(selected);
                      const m = CAPIZ_MUNICIPALITIES.find((item) => item.name === selected);
                      if (m) setPostalCode(m.postalCode);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                  >
                    {CAPIZ_MUNICIPALITIES.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="5800"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                  />
                </div>
              </div>

              {/* Street / Building / House number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street / House Number / Barangay *
                </label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. House #14, Burgos Street, Brgy. Inzo Arnaldo"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-9 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                  />
                  <Building className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Floor / Unit / Landmark (Optional, Foodpanda style) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Floor / Unit / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={floorUnit}
                  onChange={(e) => setFloorUnit(e.target.value)}
                  placeholder="e.g. 2nd Floor, Room 302, Yellow gate beside sari-sari store"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                />
              </div>

              {/* Delivery instructions / notes for rider (Optional, Foodpanda style) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Instructions / Note for Rider (Optional)
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Please ring the doorbell twice. If not answering, leave with guard."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#D96B27] focus:ring-1 focus:ring-[#D96B27]/30 transition"
                  />
                </div>
              </div>

              {/* Set as default checkbox */}
              <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-[#D96B27] focus:ring-[#D96B27] h-4 w-4"
                />
                <span>Set as default delivery address</span>
              </label>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 py-3 px-5 text-xs sm:text-sm font-semibold text-slate-700 transition cursor-pointer"
                >
                  Back to Map
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3.5 px-6 text-sm font-bold text-white shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Address...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingAddress ? 'Save Changes' : 'Save Address'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodpandaAddressModal;
