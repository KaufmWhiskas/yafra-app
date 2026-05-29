import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Coordinate } from "../utils/geo";

export const FALLBACK_COORDINATE: Coordinate = {
  latitude: 51.5074, // Default global fallback (London)
  longitude: -0.1278,
};

export function useLocation() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    async function fetchIpFallback() {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data && data.latitude && data.longitude) {
          setUserLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          setUserLocation(FALLBACK_COORDINATE);
        }
      } catch {
        setUserLocation(FALLBACK_COORDINATE);
      }
    }

    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setHasLocationPermission(true);

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch {
          try {
            const cachedLocation = await Location.getLastKnownPositionAsync();
            if (cachedLocation) {
              setUserLocation({
                latitude: cachedLocation.coords.latitude,
                longitude: cachedLocation.coords.longitude,
              });
            } else {
              await fetchIpFallback();
            }
          } catch {
            await fetchIpFallback();
          }
        }
      } else {
        await fetchIpFallback();
      }
    }

    requestLocation();
  }, []);

  return { hasLocationPermission, userLocation };
}
