import { useRef, useState, useCallback, useMemo } from 'react';
import { Region } from 'react-native-maps';
import { BoundingBox, calculateDistance } from '../utils/geo';

function debounce<A extends unknown[], R>(
  func: (...args: A) => R,
  delay: number,
): (...args: A) => void {
  let timeoutId: number;
  return (...args: A) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay) as unknown as number;
  };
}

export function useMapScanner(
  loadData: (bbox: BoundingBox, forceRemote: boolean) => Promise<void>,
) {
  const lastScannedRegionRef = useRef<Region | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanButton, setShowScanButton] = useState(false);
  const isScanningRef = useRef(false);

  const executeScan = useCallback(
    async (region: Region, force: boolean = false) => {
      // Guard against double clicks during ongoing remote ingestion loops
      if (isScanningRef.current && force) return;

      const bbox: BoundingBox = {
        minLat: region.latitude - region.latitudeDelta / 2,
        maxLat: region.latitude + region.latitudeDelta / 2,
        minLon: region.longitude - region.longitudeDelta / 2,
        maxLon: region.longitude + region.longitudeDelta / 2,
      };

      // --- MODE A: STANDARD BACKGROUND MAP PAN (force === false) ---
      if (!force) {
        if (lastScannedRegionRef.current) {
          const distanceMoved = calculateDistance(
            {
              latitude: lastScannedRegionRef.current.latitude,
              longitude: lastScannedRegionRef.current.longitude,
            },
            { latitude: region.latitude, longitude: region.longitude },
          );

          // If user panned past 400m, keep the button alive to prompt ingestion
          if (distanceMoved > 0.4) {
            setShowScanButton(true);
          }

          // Anti-spam guard: skip drawing update queries if delta is under 200m
          if (distanceMoved < 0.2) {
            return;
          }
        } else {
          // Keep button visible on fresh cold app boots
          setShowScanButton(true);
        }

        // Fetch local database elements ONLY (100% Free)
        await loadData(bbox, false);
        return; // <-- CRITICAL: Stops waterfall from leaking into remote ingestion code blocks!
      }

      // --- MODE B: EXPLICIT CTA RE-SCAN BUTTON PRESS (force === true) ---
      isScanningRef.current = true;
      setIsScanning(true);

      try {
        // Lock this current coordinate boundary group as our fresh tracking reference
        lastScannedRegionRef.current = region;

        // Fire full database ingestion routine from remote endpoints
        await loadData(bbox, true);

        // Scan succeeded! NOW we can hide the manual prompt button container layout safely
        setShowScanButton(false);
      } catch (err) {
        console.error(
          '[MapScanner] Remote database scanning pipeline failed:',
          err,
        );
      } finally {
        isScanningRef.current = false;
        setIsScanning(false);
      }
    },
    [loadData],
  );

  const scanRegion = useMemo(() => debounce(executeScan, 600), [executeScan]);

  return {
    scanRegion,
    isScanning,
    showScanButton,
  };
}
