import { useRef, useState, useCallback } from 'react';
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
  const lastLoadedLocation = useRef<Coordinate | null>(null); // Tracks local Supabase DB queries
  const lastUserLocation = useRef<Coordinate | null>(null);
  const [showScanButton, setShowScanButton] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // New lock state

  const scanUserRadius = useCallback(
    async (userCoord: Coordinate) => {
      if (isScanning) return; // Prevent user automation if a manual viewport fetch is running
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
    },
    [isScanning],
  );

  const scanRegion = useCallback(
    async (region: Region, forceManualSearch = false) => {
      const bbox = getRegionBBox(region);

      // Calculate exactly how many base grid tiles span across the current screen view
      const latSpan = Math.ceil(region.latitudeDelta / GRID_STEP);
      const lonSpan = Math.ceil(region.longitudeDelta / GRID_STEP);
      const tileCount = latSpan * lonSpan;

      const isTightZoom = tileCount <= 9;
      const isCityScale = tileCount >= 1 && tileCount <= 49;

      const currentCoord = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      // Distance since we last called Google Places
      const apiDistance = lastScannedLocation.current
        ? calculateDistance(lastScannedLocation.current, currentCoord)
        : Infinity;

      // Distance since we last queried our local Supabase DB
      const dbDistance = lastLoadedLocation.current
        ? calculateDistance(lastLoadedLocation.current, currentCoord)
        : Infinity;

      const willAutoScanExecute = isTightZoom && apiDistance >= 0.5;

      setTimeout(() => {
        setShowScanButton(
          isCityScale && !willAutoScanExecute && !forceManualSearch,
        );
      }, 0);

      // Guard 1: Ignore micro-movements to prevent DB flooding (Threshold: ~100m)
      if (dbDistance < 0.1 && !forceManualSearch) {
        return;
      }

      // Guard passed: We are moving enough to need new local points. Update the DB anchor.
      lastLoadedLocation.current = currentCoord;

      if (!isTightZoom && !forceManualSearch) {
        await loadData(bbox);
        return;
      }

      // Guard 2: If we moved >100m but <500m, just query local DB, don't hit Google yet
      if (apiDistance < 0.5 && !forceManualSearch) {
        await loadData(bbox);
        return;
      }

      // Guard 3: We moved > 500m! Update the API anchor, query DB, and hit Google.
      setIsScanning(true);
      lastScannedLocation.current = currentCoord;
      try {
        await loadData(bbox);
        await triggerIngest(bbox);
        await loadData(bbox); // Refresh DB cache with new Google data
      } catch (error) {
        console.error('Failed to update viewport registry:', error);
      } finally {
        setIsScanning(false);
      }
    },
    [loadData],
  );

  return { scanRegion, scanUserRadius, showScanButton, isScanning };
}
