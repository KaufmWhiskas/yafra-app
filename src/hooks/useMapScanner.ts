import { useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../services/restaurantService';
import {
  API_SCAN_THRESHOLD,
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
  MAX_SCAN_BUTTON_THRESHOLD,
} from '../utils/geo';

/**
 * Custom hook to monitor map region changes and trigger background data ingestion.
 * Prevents heavy queries by tracking zoom levels and allowing manual search overrides.
 */
export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const [showScanButton, setShowScanButton] = useState(false);

  /**
   * Synchronizes map coordinates with backend repositories.
   * Evaluates movement deltas to determine whether an external API ingest
   * is required, while ensuring database records are pulled on minor
   * viewport changes.
   */
  const scanRegion = async (region: Region, forceManualSearch = false) => {
    const bbox = getRegionBBox(region);

    // Auto-scan is blocked if the viewport width crosses the tight tile boundary
    const isPastAutoScan = region.latitudeDelta >= API_SCAN_THRESHOLD;

    // Scan button is only allowed if the viewport spans smaller than a small city (~2.7km)
    const canScanArea = region.latitudeDelta <= MAX_SCAN_BUTTON_THRESHOLD;

    // Defer the state update to the next execution tick to prevent interrupting the native mount cycle
    setTimeout(() => {
      // Button displays if auto-scan is active/off but we remain within city bounds limits
      setShowScanButton(isPastAutoScan && canScanArea);
    }, 0);

    // Stop background ingest if wide, unless user triggered the explicit override button
    if (isPastAutoScan && !forceManualSearch) {
      await loadData(bbox); // Still aggressively populate markers from the local DB!
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

  return { scanRegion, showScanButton };
}
