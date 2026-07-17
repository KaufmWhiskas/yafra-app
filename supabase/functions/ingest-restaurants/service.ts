import { BoundingBox, shouldSkipGridTile } from './scanner.ts';
import { RestaurantRecord } from './parser.ts';
import { getIntersectingTiles, getSubTiles, GRID_STEP } from './grid.ts';

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

export interface RestaurantFetcher {
  fetchData: (bbox: BoundingBox) => Promise<RestaurantRecord[]>;
}

interface ScanMetrics {
  apiCallsCount: number;
}

const MAX_RECURSION_DEPTH = 2; // Max depth for quadtree subdivision. Level 0 -> 1 -> 2.

function tileIdToBoundingBox(tileId: string): BoundingBox {
  const parts = tileId.split('_');
  const baseLatIndex = Number(parts[0]);
  const baseLonIndex = Number(parts[1]);

  let minLat = baseLatIndex * GRID_STEP;
  let minLon = baseLonIndex * GRID_STEP;
  let currentStep = GRID_STEP;

  for (let i = 2; i < parts.length; i++) {
    const quadrant = Number(parts[i]);
    const halfStep = currentStep / 2;

    if (quadrant === 1 || quadrant === 3) minLon += halfStep;
    if (quadrant === 2 || quadrant === 3) minLat += halfStep;
    currentStep = halfStep;
  }

  return {
    minLat: minLat,
    maxLat: minLat + currentStep,
    minLon: minLon,
    maxLon: minLon + currentStep,
  };
}

async function scanTileRecursively(
  tileId: string,
  level: number,
  supabase: OrchestratorDatabaseClient,
  fetcher: RestaurantFetcher,
  metrics: ScanMetrics, // Added: Metrics accumulator object
): Promise<void> {
  const tileBbox = tileIdToBoundingBox(tileId);

  // Every execution of fetcher.fetchData is one Google API call
  metrics.apiCallsCount++;
  const restaurants = await fetcher.fetchData(tileBbox);

  // If we get 20 results, Google capped us. Subdivide to get the hidden ones.
  if (restaurants.length === 20 && level < MAX_RECURSION_DEPTH) {
    const subTiles = getSubTiles(tileId);
    await Promise.all(
      subTiles.map((subTileId) =>
        scanTileRecursively(subTileId, level + 1, supabase, fetcher, metrics),
      ),
    );

    // FIX: We removed the early `return;` here.
    // We MUST allow the code to proceed downward to log this parent tile in grid_history!
  } else if (restaurants.length > 0) {
    // Only upsert if we didn't subdivide (the children will handle their own upserts)
    const { error: upsertError } = await supabase
      .from('restaurants')
      .upsert(restaurants, { onConflict: 'google_place_id' });
    if (upsertError) throw upsertError;
  }

  // FIX: Always mark the tile as scanned so we don't repeat this costly recursion!
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
 * distinct fixed grid tiles, returning the final metrics for logging.
 */
export async function fetchAndStoreRestaurants(
  bbox: BoundingBox,
  supabase: OrchestratorDatabaseClient,
  fetcher: RestaurantFetcher,
  userId: string,
): Promise<ScanMetrics> {
  // Changed: Now returns the metrics object
  const metrics: ScanMetrics = { apiCallsCount: 0 };
  const tiles = getIntersectingTiles(bbox);

  const tilesToScan: string[] = [];
  for (const tileId of tiles) {
    const skip = await shouldSkipGridTile(tileId, supabase);
    if (!skip) {
      tilesToScan.push(tileId);
    }
  }

  if (tilesToScan.length === 0) {
    return metrics;
  }

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

  // Pass the metrics accumulator into our recursive loop
  await Promise.all(
    tilesToScan.map((tileId) =>
      scanTileRecursively(tileId, 0, supabase, fetcher, metrics),
    ),
  );

  return metrics;
}
