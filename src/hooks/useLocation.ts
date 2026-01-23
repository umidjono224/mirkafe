import { useState, useCallback } from 'react';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolokatsiya qo\'llab-quvvatlanmaydi');
      setPermissionDenied(true);
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from coordinates using reverse geocoding
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          try {
            // Using a simple reverse geocoding approach
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'uz',
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                address = data.display_name;
              }
            }
          } catch (geocodeErr) {
            console.warn('Geocoding failed:', geocodeErr);
          }

          const locationData = {
            lat: latitude,
            lng: longitude,
            address,
          };

          setLocation(locationData);
          setLoading(false);
          setPermissionDenied(false);
          resolve(locationData);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLoading(false);
          
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionDenied(true);
            setError('Joylashuv ruxsati berilmadi');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setError('Joylashuv ma\'lumotlari mavjud emas');
          } else if (err.code === err.TIMEOUT) {
            setError('Joylashuv so\'rovi vaqti tugadi');
          } else {
            setError('Joylashuvni aniqlashda xatolik');
          }
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    permissionDenied,
    requestLocation,
    clearLocation,
  };
}
