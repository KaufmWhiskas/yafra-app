import { useEffect, useRef } from "react";
import { Region } from "react-native-maps";
import { triggerIngest } from "../services/restaurantService";
import {
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
} from "../utils/geo";

/**
 * Custom hook to monitor map region changes and trigger background data ingestion
 * with debouncing and minimum distance safeguards.
 */
export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const scanRegion = (region: Region) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const currentCoord: Coordinate = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      if (lastScannedLocation.current) {
        const distance = calculateDistance(
          lastScannedLocation.current,
          currentCoord,
        );
        if (distance < 0.5) return; // Ignore movements under 500 meters
      }

      lastScannedLocation.current = currentCoord;
      const bbox = getRegionBBox(region);

      try {
        await triggerIngest(bbox);
        await loadData(bbox);
      } catch (error) {
        console.error("Failed to ingest or refresh restaurants:", error);
      }
    }, 800);
  };

  return { scanRegion };
}
