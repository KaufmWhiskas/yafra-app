import { useRef, useState, useCallback } from 'react';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../services/restaurantService';
import {
  BoundingBox,
  calculateDistance,
  Coordinate,
  getRegionBBox,
} from '../utils/geo';

const GRID_STEP = 0.005;

export function useMapScanner(loadData: (bbox: BoundingBox) => Promise<void>) {
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const lastLoadedLocation = useRef<Coordinate | null>(null);
  const lastUserLocation = useRef<Coordinate | null>(null);
  const debounceTimer = useRef<number | null>(null); // Guard reference for transient camera movements

  const [showScanButton, setShowScanButton] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const scanUserRadius = useCallback(
    async (userCoord: Coordinate) => {
      if (isScanning) return;
      if (lastUserLocation.current) {
        const movement = calculateDistance(lastUserLocation.current, userCoord);
        if (movement < 0.2) return;
      }
      lastUserLocation.current = userCoord;

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

      const latSpan = Math.ceil(region.latitudeDelta / GRID_STEP);
      const lonSpan = Math.ceil(region.longitudeDelta / GRID_STEP);
      const tileCount = latSpan * lonSpan;

      const isTightZoom = tileCount <= 9;
      const isCityScale = tileCount >= 1 && tileCount <= 49;

      const currentCoord = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      const apiDistance = lastScannedLocation.current
        ? calculateDistance(lastScannedLocation.current, currentCoord)
        : Infinity;

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

      // Clear any pending debounced animation handlers to absorb ongoing drags smoothly
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      // Wrapper handler function to execute database load queries safely
      const executeScanLifecycle = async () => {
        try {
          // STEP 1: Fire off the database select pass immediately.
          await loadData(bbox);
          lastLoadedLocation.current = currentCoord;

          const shouldIngest = willAutoScanExecute || forceManualSearch;
          if (!shouldIngest) return;

          // STEP 2: Fire the heavy edge function ingestion completely in the background.
          setIsScanning(true);
          lastScannedLocation.current = currentCoord;
          triggerIngest(bbox)
            .then(() => loadData(bbox))
            .catch((err) =>
              console.error('Background ingest sync failed:', err),
            )
            .finally(() => {
              setIsScanning(false);
            });
        } catch (error) {
          console.error('Map loading error:', error);
        }
      };

      if (forceManualSearch) {
        // Run immediately if button is pressed
        await executeScanLifecycle();
      } else {
        // Debounce automatic panning checks by 400ms to filter momentum flings safely
        debounceTimer.current = setTimeout(() => {
          executeScanLifecycle();
        }, 400) as unknown as number;
      }
    },
    [loadData],
  );

  return { scanRegion, scanUserRadius, showScanButton, isScanning };
}
