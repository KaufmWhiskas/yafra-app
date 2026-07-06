import { BoundingBox, shouldSkipGridTile } from './scanner.ts';
import { RestaurantRecord } from './parser.ts';
import { getIntersectingTiles } from './grid.ts';

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

  // 4. Iterate over each unmapped tile block independently
  for (const tileId of tilesToScan) {
    const [latIndex, lonIndex] = tileId.split('_').map(Number);

    // Build a mock BoundingBox representing this exact 0.001 degree square tile
    const tileBbox: BoundingBox = {
      minLat: latIndex * 0.001,
      maxLat: (latIndex + 1) * 0.001,
      minLon: lonIndex * 0.001,
      maxLon: (lonIndex + 1) * 0.001,
    };

    const restaurants = await fetcher.fetchData(tileBbox);

    if (restaurants.length > 0) {
      const { error: upsertError } = await supabase
        .from('restaurants')
        .upsert(restaurants, { onConflict: 'google_place_id' });
      if (upsertError) throw upsertError;
    }

    // Save history explicitly to the parallel grid layout tracking schema
    const { error: historyError } = await supabase
      .from('grid_history')
      .upsert(
        { tile_id: tileId, last_scan_date: new Date().toISOString() },
        { onConflict: 'tile_id' },
      );

    if (historyError) throw historyError;
  }
}
