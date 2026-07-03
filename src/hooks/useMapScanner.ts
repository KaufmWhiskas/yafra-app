import { useRef } from 'react';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../services/restaurantService';
import {
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
} from '../utils/geo';

/**
 * Custom hook to monitor map region changes and trigger background data ingestion.
 */
export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  /**
   * Synchronizes map coordinates with backend repositories.
   * Evaluates movement deltas to determine whether an external API ingest
   * is required, while ensuring database records are pulled on minor
   * viewport changes.
   */
  const scanRegion = async (region: Region) => {
    const currentCoord = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    const bbox = getRegionBBox(region);
    const distance = lastScannedLocation.current
      ? calculateDistance(lastScannedLocation.current, currentCoord)
      : Infinity;
    // Minor panning: Instantly fetch existing database points without hitting Google limits
    if (distance < 0.5) {
      await loadData(bbox);
      return;
    }
    // Major panning: Update cache anchor and run background ingestion task
    lastScannedLocation.current = currentCoord;
    try {
      // Render existing records immediately to keep user experience fluid
      await loadData(bbox);
      // Execute external integration pipeline asynchronously without blocking the thread
      triggerIngest(bbox).catch((error) =>
        console.error('Background ingestion pipeline failure:', error),
      );
    } catch (error) {
      console.error('Failed to update map viewport data registry:', error);
    }
  };

  return { scanRegion };
}
