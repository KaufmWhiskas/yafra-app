import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Coordinate } from "../utils/geo";

export function useLocation() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setHasLocationPermission(true);
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Balanced saves battery while giving ~100m accuracy
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.error("Error fetching location", error);
        }
      }
    }

    requestLocation();
  }, []);

  return { hasLocationPermission, userLocation };
}
