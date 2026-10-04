import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerLocation {
  latitude: number;
  longitude: number;
  fullAddress: string;
  source?: 'gps' | 'manual' | 'map_pin';
}

interface CustomerLocationContextType {
  location: CustomerLocation | null;
  setLocation: (loc: CustomerLocation | null) => void;
  detectLocation: () => Promise<CustomerLocation | null>;
  isDetecting: boolean;
  permissionError: string | null;
  clearError: () => void;
  clearLocation: () => void;
  updateLocationFromCoordinates: (lat: number, lng: number, customAddress?: string) => Promise<CustomerLocation>;
}

const CustomerLocationContext = createContext<CustomerLocationContextType | undefined>(undefined);

const STORAGE_KEY = 'customer_detected_location';

export const CustomerLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<CustomerLocation | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const setLocation = (loc: CustomerLocation | null) => {
    setLocationState(loc);
    if (loc) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } catch {
        // ignore
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setPermissionError(null);
  };

  const clearError = () => {
    setPermissionError(null);
  };

  // Reverse geocode with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    }
    return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const updateLocationFromCoordinates = async (
    lat: number,
    lng: number,
    customAddress?: string
  ): Promise<CustomerLocation> => {
    const formattedLat = parseFloat(lat.toFixed(7));
    const formattedLng = parseFloat(lng.toFixed(7));

    let address = customAddress;
    if (!address) {
      address = await reverseGeocode(formattedLat, formattedLng);
    }

    const loc: CustomerLocation = {
      latitude: formattedLat,
      longitude: formattedLng,
      fullAddress: address,
      source: customAddress ? 'manual' : 'map_pin',
    };

    setLocation(loc);
    setPermissionError(null);
    return loc;
  };

  const detectLocation = (): Promise<CustomerLocation | null> => {
    return new Promise((resolve) => {
      setPermissionError(null);

      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser. Please enter your address manually.';
        setPermissionError(msg);
        resolve(null);
        return;
      }

      setIsDetecting(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const addr = await reverseGeocode(lat, lng);
            const loc: CustomerLocation = {
              latitude: parseFloat(lat.toFixed(7)),
              longitude: parseFloat(lng.toFixed(7)),
              fullAddress: addr,
              source: 'gps',
            };
            setLocation(loc);
            setPermissionError(null);
            setIsDetecting(false);
            resolve(loc);
          } catch (e) {
            setIsDetecting(false);
            resolve(null);
          }
        },
        (error) => {
          setIsDetecting(false);
          let errorMessage = 'Failed to detect your location. Please enter your address manually.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              'Location permission was denied. Please allow location access or type your address / click on the map to set your location manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage =
              'Location information is currently unavailable. Please enter your address or select your pin on the map manually.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage =
              'Location request timed out. Please try again or place your pin on the map manually.';
          }
          setPermissionError(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  return (
    <CustomerLocationContext.Provider
      value={{
        location,
        setLocation,
        detectLocation,
        isDetecting,
        permissionError,
        clearError,
        clearLocation,
        updateLocationFromCoordinates,
      }}
    >
      {children}
    </CustomerLocationContext.Provider>
  );
};

export const useCustomerLocation = () => {
  const context = useContext(CustomerLocationContext);
  if (!context) {
    throw new Error('useCustomerLocation must be used within a CustomerLocationProvider');
  }
  return context;
};
