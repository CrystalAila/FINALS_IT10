import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

export interface RouteSummary {
  distanceKm: string;
  timeMinutes: number;
  totalDistanceMeters: number;
  totalTimeSeconds: number;
}

interface RoutingControlProps {
  origin: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  onRouteCalculated?: (summary: RouteSummary) => void;
  onRouteError?: (error: any) => void;
  showItinerary?: boolean;
}

export const RoutingControl: React.FC<RoutingControlProps> = ({
  origin,
  destination,
  onRouteCalculated,
  onRouteError,
  showItinerary = false,
}) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Check if origin and destination are valid coordinates
    if (
      !origin ||
      !destination ||
      isNaN(origin[0]) ||
      isNaN(origin[1]) ||
      isNaN(destination[0]) ||
      isNaN(destination[1])
    ) {
      return;
    }

    // Clean up any existing control before creating new one
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (err) {
        // ignore removal error if already detached
      }
      routingControlRef.current = null;
    }

    try {
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(origin[0], origin[1]),
          L.latLng(destination[0], destination[1]),
        ],
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
        }),
        lineOptions: {
          styles: [
            { color: '#0f766e', opacity: 0.25, weight: 9 }, // Soft emerald shadow
            { color: '#16a34a', opacity: 0.9, weight: 5 },  // Main delivery route
          ],
          extendToWaypoints: true,
          missingRouteStyles: [{ color: '#f59e0b', opacity: 0.7, weight: 4 }],
        },
        createMarker: () => null, // Suppress default markers because we render custom icons
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        collapsible: true,
        show: showItinerary,
      });

      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const summary = routes[0].summary;
          const distKm = (summary.totalDistance / 1000).toFixed(1);
          const timeMins = Math.max(1, Math.round(summary.totalTime / 60));
          if (onRouteCalculated) {
            onRouteCalculated({
              distanceKm: distKm,
              timeMinutes: timeMins,
              totalDistanceMeters: summary.totalDistance,
              totalTimeSeconds: summary.totalTime,
            });
          }
        }
      });

      routingControl.on('routingerror', (err: any) => {
        if (onRouteError) {
          onRouteError(err);
        }
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;

      // Adjust itinerary container visibility according to prop
      const container = routingControl.getContainer();
      if (container) {
        if (!showItinerary) {
          container.style.display = 'none';
        } else {
          container.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Failed to initialize routing control:', err);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          // ignore cleanup error
        }
        routingControlRef.current = null;
      }
    };
  }, [origin[0], origin[1], destination[0], destination[1], map, showItinerary]);

  return null;
};

export default RoutingControl;
