import { useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../services/restaurantService';
import {
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
} from '../utils/geo';

// Match your backend grid step exactly (0.005 degrees = ~550m)
const GRID_STEP = 0.005;

export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const lastUserLocation = useRef<Coordinate | null>(null);
  const [showScanButton, setShowScanButton] = useState(false);

  /**
   * Automatically triggers a tight grid scan focused around the user's active moving coordinate path.
   * Typically wired to your live geolocation position stream context.
   */
  const scanUserRadius = async (userCoord: Coordinate) => {
    if (lastUserLocation.current) {
      const movement = calculateDistance(lastUserLocation.current, userCoord);
      if (movement < 0.2) return; // Only update if user walked more than 200 meters
    }
    lastUserLocation.current = userCoord;

    // Calculate a bounding box matching a 3x3 cluster around the user (~1.6km x 1.6km area)
    const userBbox: BoundingBox = {
      minLat: userCoord.latitude - GRID_STEP * 1.5,
      maxLat: userCoord.latitude + GRID_STEP * 1.5,
      minLon: userCoord.longitude - GRID_STEP * 1.5,
      maxLon: userCoord.longitude + GRID_STEP * 1.5,
    };

    try {
      await triggerIngest(userBbox);
    } catch (e) {
      console.error('Failed to update user rolling grid cache:', e);
    }
  };

  /**
   * Monitors map viewport camera movements, managing automated tight-zoom lookups
   * vs city-scale manual overrides.
   */
  const scanRegion = async (region: Region, forceManualSearch = false) => {
    const bbox = getRegionBBox(region);

    // Calculate exactly how many base grid tiles span across the current screen view
    const latSpan = Math.ceil(region.latitudeDelta / GRID_STEP);
    const lonSpan = Math.ceil(region.longitudeDelta / GRID_STEP);
    const tileCount = latSpan * lonSpan;

    // Auto-scan viewports is active only when zoomed in tightly (<= 3x3 tiles, i.e., 9 tiles)
    const isTightZoom = tileCount <= 9;

    // Manual scan button is allowed when spanning between a 3x3 up to a 7x7 city envelope (49 tiles)
    const isCityScale = tileCount > 9 && tileCount <= 49;

    // Defer the state update to the next execution tick to prevent interrupting the native mount cycle
    setTimeout(() => {
      setShowScanButton(isCityScale && !forceManualSearch);
    }, 0);

    // Block background sync if we are outside tight zoom parameters, unless explicit manual button click
    if (!isTightZoom && !forceManualSearch) {
      await loadData(bbox); // Still fluidly render anything already present in local db
      return;
    }

    const currentCoord = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    const distance = lastScannedLocation.current
      ? calculateDistance(lastScannedLocation.current, currentCoord)
      : Infinity;

    if (distance < 0.5 && !forceManualSearch) {
      await loadData(bbox);
      return;
    }

    lastScannedLocation.current = currentCoord;
    try {
      await loadData(bbox);
      await triggerIngest(bbox);
      await loadData(bbox);
    } catch (error) {
      console.error('Failed to update viewport registry:', error);
    }
  };

  return { scanRegion, scanUserRadius, showScanButton };
}
