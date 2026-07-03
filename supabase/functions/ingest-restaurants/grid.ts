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
