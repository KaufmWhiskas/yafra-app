import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setHasLocationPermission(true);
      }
    }

    requestLocation();
  }, []);

  return { hasLocationPermission };
}
