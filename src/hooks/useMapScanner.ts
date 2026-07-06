import { useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../services/restaurantService';
import {
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
  ZOOM_OUT_THRESHOLD,
} from '../utils/geo';

/**
 * Custom hook to monitor map region changes and trigger background data ingestion.
 * Prevents heavy queries by tracking zoom levels and allowing manual search overrides.
 */
export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  /**
   * Synchronizes map coordinates with backend repositories.
   * Evaluates movement deltas to determine whether an external API ingest
   * is required, while ensuring database records are pulled on minor
   * viewport changes.
   */
  const scanRegion = async (region: Region, forceManualSearch = false) => {
    const bbox = getRegionBBox(region);

    // Check if the current zoom delta crosses our macro-scale boundary threshold
    const zoomedOut = region.latitudeDelta >= ZOOM_OUT_THRESHOLD;
    setIsZoomedOut(zoomedOut);

    // If the map is zoomed out too far, block background requests to safeguard server memory
    if (zoomedOut && !forceManualSearch) {
      await loadData(bbox);
      return;
    }

    const currentCoord = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    const distance = lastScannedLocation.current
      ? calculateDistance(lastScannedLocation.current, currentCoord)
      : Infinity;

    // Minor panning: Instantly fetch existing database points without hitting Google limits
    if (distance < 0.5 && !forceManualSearch) {
      await loadData(bbox);
      return;
    }

    // Major panning or manual search override: Update cache anchor and run ingestion task
    lastScannedLocation.current = currentCoord;
    try {
      // Render existing records immediately to keep user experience fluid
      await loadData(bbox);

      // Execute external integration pipeline asynchronously without blocking the thread
      await triggerIngest(bbox);

      // Reload matching dataset rows into state memory caches
      await loadData(bbox);
    } catch (error) {
      console.error('Failed to update map viewport data registry:', error);
    }
  };

  return { scanRegion, isZoomedOut };
}
