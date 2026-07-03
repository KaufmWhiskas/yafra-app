import { BoundingBox } from "./scanner.ts";

/**
 * The fixed step size for the geographic grid, in degrees.
 * Approximately 111 meters at the equator.
 */
export const GRID_STEP = 0.001;

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
