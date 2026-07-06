import { BoundingBox } from './scanner.ts';

/**
 * The fixed step size for the geographic grid, in degrees.
 * Approximately 550 meters.
 */
export const GRID_STEP = 0.005;

/**
 * Snaps a geographic coordinate to a standardized tile ID string.
 * This creates a uniform grid for spatial indexing and caching.
 *
 * @param lat The latitude of the coordinate.
 * @param lon The longitude of the coordinate.
 * @returns A string representing the tile ID, e.g., "49471_8452".
 */
export function coordinateToTileId(lat: number, lon: number): string {
  const latIndex = Math.floor(lat / GRID_STEP);
  const lonIndex = Math.floor(lon / GRID_STEP);
  return `${latIndex}_${lonIndex}`;
}

/**
 * Calculates all grid tiles that intersect with a given bounding box.
 * Includes a safety limit to prevent excessively large area requests.
 *
 * @param bbox The geographic bounding box.
 * @returns An array of tile ID strings.
 * @throws {RangeError} If the bounding box covers more than 25 tiles.
 */
export function getIntersectingTiles(bbox: BoundingBox): string[] {
  const startLat = Math.floor(bbox.minLat / GRID_STEP);
  const endLat = Math.floor(bbox.maxLat / GRID_STEP);
  const startLon = Math.floor(bbox.minLon / GRID_STEP);
  const endLon = Math.floor(bbox.maxLon / GRID_STEP);

  const latSpan = endLat - startLat + 1;
  const lonSpan = endLon - startLon + 1;

  if (latSpan * lonSpan > 25) {
    throw new RangeError(
      `Area too large. Requested ${latSpan * lonSpan} tiles, but the limit is 25.`,
    );
  }

  const tiles: string[] = [];
  for (let i = startLat; i <= endLat; i++) {
    for (let j = startLon; j <= endLon; j++) {
      tiles.push(`${i}_${j}`);
    }
  }
  return tiles;
}

/**
 * Splits a tile into 4 sub-quadrants.
 * Level 0: 49471_8452
 * Level 1: 49471_8452_0 (Bottom-Left), _1 (Bottom-Right), _2 (Top-Left), _3 (Top-Right)
 */
export function getSubTiles(tileId: string): string[] {
  return [`${tileId}_0`, `${tileId}_1`, `${tileId}_2`, `${tileId}_3`];
}

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in meters.
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the center coordinate and circumscribed radius of a grid tile.
 * @param tileId The ID string of the tile (e.g., "49471_8452").
 * @returns An object containing the center latitude, longitude, and radius in meters.
 */
export function getTileCenterAndRadius(tileId: string) {
  const [latIndex, lonIndex] = tileId.split('_').map(Number);

  const minLat = latIndex * GRID_STEP;
  const minLon = lonIndex * GRID_STEP;

  const centerLat = minLat + GRID_STEP / 2;
  const centerLon = minLon + GRID_STEP / 2;

  const radiusMeters = calculateDistanceInMeters(
    centerLat,
    centerLon,
    minLat,
    minLon,
  );

  return { centerLat, centerLon, radiusMeters };
}
