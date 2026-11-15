import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Layout from '../../components/Layout';
import api from '../../lib/axios';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, resolveProductImage } from '../../types/marketplace';
import type { Order } from '../../types/marketplace';
import { RoutingControl, type RouteSummary } from '../../components/rider/RoutingControl';
import {
  MapPin,
  Phone,
  Navigation,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Store,
  Compass,
  Copy,
  Check,
  Clock,
  Route,
  Crosshair,
  RefreshCw,
  Layers,
} from 'lucide-react';

// Custom Customer Pin Icon (Emerald Green with white drop-pin anchor)
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
        box-shadow: 0 4px 14px rgba(22, 163, 74, 0.45);
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
        background: rgba(0, 0, 0, 0.3);
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [38, 42],
  iconAnchor: [19, 42],
  popupAnchor: [0, -42],
});

// Custom Farm Store Pin Icon (Brand Orange)
const farmPinIcon = L.divIcon({
  className: 'custom-farm-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%);">
      <div style="
        background: linear-gradient(135deg, #D96B27 0%, #B34F14 100%);
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(217, 107, 39, 0.4);
        border: 2px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
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
  iconSize: [34, 38],
  iconAnchor: [17, 38],
  popupAnchor: [0, -38],
});

// Custom Rider Live Location Marker Icon (Vibrant Blue with Pulse Halo)
const riderPinIcon = L.divIcon({
  className: 'custom-rider-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -50%);">
      <div style="
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
        border: 2.5px solid #ffffff;
      ">
        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11" fill="#ffffff" />
        </svg>
      </div>
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid #3b82f6;
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.7;
        pointer-events: none;
      "></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Helper component to adjust map bounds to include all active waypoints
const MapBoundsAdjuster: React.FC<{
  customerCoords: [number, number];
  originCoords?: [number, number] | null;
  farmCoords?: [number, number] | null;
}> = ({ customerCoords, originCoords, farmCoords }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const points: [number, number][] = [customerCoords];
    if (originCoords && originCoords[0] && originCoords[1]) {
      points.push(originCoords);
    }
    if (farmCoords && farmCoords[0] && farmCoords[1]) {
      points.push(farmCoords);
    }
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView(customerCoords, 15, { animate: true });
    }
  }, [customerCoords[0], customerCoords[1], originCoords?.[0], originCoords?.[1], farmCoords?.[0], farmCoords?.[1], map]);

  return null;
};

const RiderOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [riderCoords, setRiderCoords] = useState<[number, number] | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [routeOriginMode, setRouteOriginMode] = useState<'rider' | 'farm'>('rider');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Default coordinate: Roxas City, Capiz
  const DEFAULT_LAT = 11.5853;
  const DEFAULT_LNG = 122.7511;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/rider/orders/${id}`);
        setOrder(res.data.order);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  // Live Geolocation Tracking for Rider
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderCoords([pos.coords.latitude, pos.coords.longitude]);
        setGpsActive(true);
      },
      (err) => {
        console.warn('Initial GPS fix warning:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderCoords([pos.coords.latitude, pos.coords.longitude]);
        setGpsActive(true);
      },
      (err) => {
        console.warn('Watch GPS position error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const updateStatus = async (newStatus: Order['status']) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.put(`/rider/orders/${order.id}/status`, { status: newStatus });
      setOrder(res.data.order);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleClaim = async () => {
    if (!order) return;
    setClaiming(true);
    try {
      const res = await api.post(`/rider/orders/${order.id}/claim`);
      setOrder(res.data.order);
      alert('Order claimed successfully! You are now assigned to this delivery.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to claim order.');
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyCoordinates = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-16 text-center text-slate-500">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-3 text-sm font-semibold">Loading delivery details & map...</p>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="rounded-3xl bg-red-50 p-8 text-center text-red-700 border border-red-200">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-2 font-bold text-base">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="mt-4 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-red-700 shadow-sm border border-red-200 hover:bg-red-50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // Customer Coordinates resolution
  const hasExactCoordinates =
    order.latitude !== null &&
    order.latitude !== undefined &&
    order.latitude !== '' &&
    order.longitude !== null &&
    order.longitude !== undefined &&
    order.longitude !== '';

  const customerLat = hasExactCoordinates ? Number(order.latitude) : DEFAULT_LAT;
  const customerLng = hasExactCoordinates ? Number(order.longitude) : DEFAULT_LNG;
  const customerCoords: [number, number] = [customerLat, customerLng];

  // Farm coordinates resolution
  const farmLat =
    order.farm?.latitude !== null && order.farm?.latitude !== undefined && order.farm?.latitude !== ''
      ? Number(order.farm.latitude)
      : null;
  const farmLng =
    order.farm?.longitude !== null && order.farm?.longitude !== undefined && order.farm?.longitude !== ''
      ? Number(order.farm.longitude)
      : null;
  const farmCoords: [number, number] | null = farmLat && farmLng ? [farmLat, farmLng] : null;

  // Active Route Origin coordinates: Rider Live GPS if chosen and available, else Farm Pickup
  const activeOriginCoords: [number, number] =
    routeOriginMode === 'rider' && riderCoords
      ? riderCoords
      : farmCoords
      ? farmCoords
      : [DEFAULT_LAT, DEFAULT_LNG];

  const customerFullAddress = [order.address_line, order.city, order.province, order.postal_code]
    .filter(Boolean)
    .join(', ');

  const farmAddress = order.farm?.full_address || order.farm?.location || 'Roxas City, Capiz';
  const customerPhone = order.phone || order.customer?.phone;

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/rider/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deliveries
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Delivery #{order.id}</p>
            {order.rider_id ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Assigned to you
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                Available to claim
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">Delivery Navigation & Route</h1>
        </div>
        <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* CUSTOMER LOCATION & OSRM ROUTE MAP */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-emerald-600" />
                  Live Delivery Route (Leaflet + OSRM)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Route drawn from{' '}
                  <span className="font-semibold text-slate-700">
                    {routeOriginMode === 'rider' && riderCoords ? "your current GPS location" : "farm pickup location"}
                  </span>{' '}
                  to customer destination.
                </p>
              </div>

              {/* Action Buttons for Route */}
              <div className="flex flex-wrap items-center gap-2">
                {riderCoords && farmCoords && (
                  <button
                    type="button"
                    onClick={() => setRouteOriginMode((m) => (m === 'rider' ? 'farm' : 'rider'))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
                    title="Switch origin between Rider live GPS and Farm"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-brand" />
                    <span>{routeOriginMode === 'rider' ? 'Route from Farm' : 'Route from My GPS'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowItinerary((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer border ${
                    showItinerary
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Route className="h-3.5 w-3.5" />
                  <span>{showItinerary ? 'Hide Directions' : 'Show Directions'}</span>
                </button>
              </div>
            </div>

            {/* Route Estimated Distance & Travel Time Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Est. Distance</p>
                  <p className="text-base sm:text-lg font-extrabold text-emerald-950">
                    {routeSummary ? `${routeSummary.distanceKm} km` : 'Calculating...'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Est. Travel Time</p>
                  <p className="text-base sm:text-lg font-extrabold text-blue-950">
                    {routeSummary ? `~${routeSummary.timeMinutes} mins` : 'Calculating...'}
                  </p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      gpsActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-800">
                    {gpsActive ? 'Live GPS Active' : 'GPS Locating...'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {routeOriginMode === 'rider' && riderCoords
                    ? 'Updating as you travel'
                    : 'Origin set to shop pickup'}
                </p>
              </div>
            </div>

            {routingError && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>{routingError}</span>
              </div>
            )}

            {/* Interactive Leaflet Map Container */}
            <div className="relative h-[340px] sm:h-[420px] w-full rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-0">
              <MapContainer
                center={customerCoords}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsAdjuster
                  customerCoords={customerCoords}
                  originCoords={activeOriginCoords}
                  farmCoords={farmCoords}
                />

                {/* Leaflet Routing Machine with OSRM */}
                <RoutingControl
                  origin={activeOriginCoords}
                  destination={customerCoords}
                  onRouteCalculated={(s) => {
                    setRouteSummary(s);
                    setRoutingError(null);
                  }}
                  onRouteError={() => {
                    setRoutingError('OSRM route calculation unavailable for this route.');
                  }}
                  showItinerary={showItinerary}
                />

                {/* Customer Pin Marker */}
                <Marker position={customerCoords} icon={customerPinIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <div className="font-bold text-slate-900 text-sm">
                        {order.customer?.fullname || 'Customer Destination'}
                      </div>
                      <p className="text-slate-600 mt-0.5">{customerFullAddress}</p>
                      {customerPhone && (
                        <p className="mt-1 font-semibold text-emerald-700">Phone: {customerPhone}</p>
                      )}
                      <div className="mt-1 font-mono text-[10px] text-slate-400">
                        {customerLat.toFixed(6)}, {customerLng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Farm Pin Marker (if coordinates available) */}
                {farmCoords && (
                  <Marker position={farmCoords} icon={farmPinIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <div className="font-bold text-amber-900 text-sm">
                          Farm Pickup: {order.farm?.name || 'Poultry Farm'}
                        </div>
                        <p className="text-slate-600 mt-0.5">{farmAddress}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Rider Live Location Marker (if riderCoords available) */}
                {riderCoords && (
                  <Marker position={riderCoords} icon={riderPinIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <div className="font-bold text-blue-900 text-sm">Your Live Location (Rider)</div>
                        <p className="text-slate-600 mt-0.5">Live GPS position tracking in real-time</p>
                        <div className="mt-1 font-mono text-[10px] text-slate-400">
                          {riderCoords[0].toFixed(6)}, {riderCoords[1].toFixed(6)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Map Legend Overlay */}
              <div className="absolute left-3 top-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-2xl shadow-sm text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-600 ring-2 ring-white"></span>
                  <span className="font-bold text-slate-800 text-[11px]">Customer Destination</span>
                </div>
                {farmCoords && (
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#D96B27] ring-2 ring-white"></span>
                    <span className="font-bold text-slate-800 text-[11px]">Farm Pickup Origin</span>
                  </div>
                )}
                {riderCoords && (
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white"></span>
                    <span className="font-bold text-slate-800 text-[11px]">Your Live GPS</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-0.5 border-t border-slate-100">
                  <span className="h-1.5 w-4 rounded-full bg-emerald-600"></span>
                  <span className="text-[10px] font-semibold text-slate-600">OSRM Navigation Route</span>
                </div>
              </div>

              {/* Exact Pin Coordinates Badge Overlay */}
              <div className="absolute right-3 bottom-3 z-[400]">
                <button
                  type="button"
                  onClick={() => handleCopyCoordinates(customerLat, customerLng)}
                  className="rounded-full bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 text-[11px] font-mono shadow-sm flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
                  title="Click to copy exact coordinates"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    {customerLat.toFixed(5)}, {customerLng.toFixed(5)}
                  </span>
                  {copiedCoords ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Customer Details Box below Map */}
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient Customer</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customer?.fullname || 'Customer'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{customerPhone || 'N/A'}</span>
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        <Phone className="h-3 w-3" /> Call
                      </a>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Address</p>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm mt-0.5">
                    {customerFullAddress}
                  </p>
                </div>

                {order.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Delivery Instructions</p>
                    <p className="font-medium text-amber-900 text-xs bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 mt-0.5">
                      "{order.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Farm Pickup Location Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-600" />
                Farm Pickup Origin
              </h2>
              {farmCoords && (
                <button
                  type="button"
                  onClick={() => setRouteOriginMode('farm')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    routeOriginMode === 'farm'
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Route className="h-3.5 w-3.5" />
                  <span>{routeOriginMode === 'farm' ? 'Active Origin' : 'Route from Here'}</span>
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Farm Name</p>
                <p className="mt-1 font-bold text-slate-900 text-sm">{order.farm?.name || 'Local Farm'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Farm Area</p>
                <p className="mt-1 font-medium text-slate-700">{order.farm?.location || 'Roxas City, Capiz'}</p>
              </div>
              {order.farm?.full_address && (
                <div className="sm:col-span-2">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Detailed Farm Address</p>
                  <p className="mt-1 font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl">{order.farm.full_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-500" />
              Items to Deliver
            </h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-200 shrink-0">
                      <img
                        src={resolveProductImage(item.product?.image, item.product?.category)}
                        alt={item.product?.name || 'Product'}
                        onError={(e) => {
                          e.currentTarget.src = resolveProductImage(null, item.product?.category);
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{item.product?.name ?? `Product #${item.product_id}`}</p>
                      <p className="text-xs text-slate-500">Size: <span className="capitalize font-semibold text-slate-700">{item.size}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">₱{Number(item.subtotal)}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Actions & Summary */}
        <div className="space-y-6">
          {/* Unclaimed order warning & button */}
          {!order.rider_id && (
            <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-6 shadow-card">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Compass className="h-5 w-5 text-amber-600" />
                Available for Order Claiming
              </div>
              <p className="mt-1.5 text-xs text-amber-800 leading-relaxed">
                This delivery order has been prepared by the seller and is ready for pickup. Claim it now to assign it to your delivery route.
              </p>
              <button
                type="button"
                disabled={claiming}
                onClick={handleClaim}
                className="mt-4 w-full rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] text-white py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Claiming Delivery...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Claim This Delivery Order
                  </>
                )}
              </button>
            </div>
          )}

          {/* Update Delivery Status Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold text-slate-900">Delivery Status Actions</h2>

            {['completed', 'cancelled'].includes(order.status) ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-semibold text-slate-600 border border-slate-100">
                This delivery is marked as <span className="font-bold capitalize">{ORDER_STATUS_LABELS[order.status] || order.status}</span>.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {order.status === 'claimed' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('out_for_delivery')}
                    disabled={updating}
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Start Delivery (Out for Delivery)
                  </button>
                )}

                {order.status === 'out_for_delivery' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('completed')}
                    disabled={updating}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Delivered & Completed
                  </button>
                )}

                {order.rider_id && ['ready', 'ready_for_delivery'].includes(order.status) && (
                  <button
                    type="button"
                    onClick={() => updateStatus('out_for_delivery')}
                    disabled={updating}
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Pickup from Farm & Deliver
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this delivery order?')) {
                      updateStatus('cancelled');
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 px-4 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Mark Delivery as Cancelled
                </button>
              </div>
            )}
          </div>

          {/* Payment & Total Summary Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold text-slate-900">Payment & Collection</h2>
            <div className="space-y-2 border-b border-slate-100 pb-4 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-bold text-slate-800 capitalize">{order.payment_method.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping / Delivery Fee</span>
                <span className="font-medium text-slate-800">₱{Number(order.shipping_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Total</span>
                <span className="font-medium text-slate-800">₱{Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-base font-extrabold text-slate-900">
              <span>Amount to Collect</span>
              <span className="text-brand text-lg">₱{Number(order.total).toFixed(2)} PHP</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RiderOrderDetails;
