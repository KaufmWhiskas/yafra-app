import { BoundingBox, shouldSkipGridTile } from './scanner.ts';
import { RestaurantRecord } from './parser.ts';
import { getIntersectingTiles, getSubTiles, GRID_STEP } from './grid.ts';

/** Strict interface for the Supabase client used in the orchestrator. */
export interface OrchestratorDatabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        data: { last_scan_date: string; [key: string]: unknown }[] | null;
        error: Error | null;
      }>;
    };
    insert: (
      data: { bbox: string } | { tile_id: string; last_scan_date: string },
    ) => Promise<{ error: Error | null }>;
    upsert: (
      data:
        | RestaurantRecord[]
        | { bbox: string; last_scan_date: string }
        | { tile_id: string; last_scan_date: string },
      options?: { onConflict: string },
    ) => Promise<{ error: Error | null }>;
  };
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    error: Error | null;
  }>;
}

/** Interface for any service that provides restaurant data. */
export interface RestaurantFetcher {
  fetchData: (bbox: BoundingBox) => Promise<RestaurantRecord[]>;
}

const MAX_RECURSION_DEPTH = 2; // Max depth for quadtree subdivision. Level 0 -> 1 -> 2.

/**
 * Converts a tile ID (e.g., "49471_8452" or "49471_8452_3") into a precise
 * geographic bounding box.
 * @param tileId The ID of the tile.
 * @returns A BoundingBox object.
 */
function tileIdToBoundingBox(tileId: string): BoundingBox {
  const parts = tileId.split('_');
  const baseLatIndex = Number(parts[0]);
  const baseLonIndex = Number(parts[1]);

  let minLat = baseLatIndex * GRID_STEP;
  let minLon = baseLonIndex * GRID_STEP;
  let currentStep = GRID_STEP;

  // Handle sub-tiles by refining the bounding box for each quadrant level
  for (let i = 2; i < parts.length; i++) {
    const quadrant = Number(parts[i]);
    const halfStep = currentStep / 2;

    // Quadrant logic: 0=BL, 1=BR, 2=TL, 3=TR
    if (quadrant === 1 || quadrant === 3) {
      // Right side
      minLon += halfStep;
    }
    if (quadrant === 2 || quadrant === 3) {
      // Top side
      minLat += halfStep;
    }
    currentStep = halfStep;
  }

  return {
    minLat: minLat,
    maxLat: minLat + currentStep,
    minLon: minLon,
    maxLon: minLon + currentStep,
  };
}

/**
 * Recursively scans a tile, subdividing it if the result set from the fetcher
 * is at the maximum limit, indicating more data may be available.
 */
async function scanTileRecursively(
  tileId: string,
  level: number,
  supabase: OrchestratorDatabaseClient,
  fetcher: RestaurantFetcher,
): Promise<void> {
  const tileBbox = tileIdToBoundingBox(tileId);
  const restaurants = await fetcher.fetchData(tileBbox);

  // If we get 20 results, it's a sign Google cut us off. Subdivide.
  if (restaurants.length === 20 && level < MAX_RECURSION_DEPTH) {
    const subTiles = getSubTiles(tileId);
    await Promise.all(
      subTiles.map((subTileId) =>
        scanTileRecursively(subTileId, level + 1, supabase, fetcher),
      ),
    );
    return; // IMPORTANT: Do not mark the parent tile as scanned
  }

  // Upsert restaurants from this tile
  if (restaurants.length > 0) {
    const { error: upsertError } = await supabase
      .from('restaurants')
      .upsert(restaurants, { onConflict: 'google_place_id' });
    if (upsertError) throw upsertError;
  }

  // Mark this tile (or sub-tile) as scanned in the history
  const { error: historyError } = await supabase
    .from('grid_history')
    .upsert(
      { tile_id: tileId, last_scan_date: new Date().toISOString() },
      { onConflict: 'tile_id' },
    );
  if (historyError) throw historyError;
}

/**
 * Orchestrates the fetching of data by breaking the viewport down into
 * distinct fixed grid tiles, skipping cached ones automatically.
 */
export async function fetchAndStoreRestaurants(
  bbox: BoundingBox,
  supabase: OrchestratorDatabaseClient,
  fetcher: RestaurantFetcher,
  userId: string,
): Promise<void> {
  // 1. Map bounding box to intersecting tile keys (enforces the 25 max safety check)
  const tiles = getIntersectingTiles(bbox);

  // 2. Filter down to tiles that actually need an external sync update
  const tilesToScan: string[] = [];
  for (const tileId of tiles) {
    const skip = await shouldSkipGridTile(tileId, supabase);
    if (!skip) {
      tilesToScan.push(tileId);
    }
  }

  if (tilesToScan.length === 0) {
    return;
  }

  // 3. Enforce user action limit gates only when a sync is required
  const { data: allowed, error: rpcError } = await supabase.rpc(
    'check_and_log_rate_limit',
    {
      p_user_id: userId,
      p_action_name: 'ingest_restaurants',
      p_max_requests: 50,
      p_window_interval: '1 hour',
    },
  );

  if (rpcError) throw rpcError;
  if (!allowed) {
    const err = new Error('Rate limit exceeded. Try again later.');
    err.name = 'RateLimitError';
    throw err;
  }

  // 4. Scan all needed tiles, allowing for recursive subdivision.
  await Promise.all(
    tilesToScan.map((tileId) =>
      scanTileRecursively(tileId, 0, supabase, fetcher),
    ),
  );
}
