import { BoundingBox, shouldSkipScan } from "./scanner.ts";
import { RestaurantRecord } from "./parser.ts";

/** Strict interface for the Supabase client used in the orchestrator. */
export interface OrchestratorDatabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{
        data: { last_scan_date: string }[] | null;
        error: Error | null;
      }>;
    };
    insert: (data: { bbox: string }) => Promise<{ error: Error | null }>;
    upsert: (
      data: RestaurantRecord[] | { bbox: string; last_scan_date: string },
      options?: { onConflict: string },
    ) => Promise<{ error: Error | null }>;
  };
}

/** Interface for any service that provides restaurant data. */
export interface RestaurantFetcher {
  fetchRestaurants: (bbox: BoundingBox) => Promise<RestaurantRecord[]>;
}

/**
 * Orchestrates the fetching of OSM data and storing it in the database.
 * Skips the operation if the bounding box was scanned recently.
 * @param bbox The geographic bounding box to scan.
 * @param supabase The Supabase database client interface.
 * @param fetcher The data provider used to fetch restaurants.
 */
export async function fetchAndStoreRestaurants(
  bbox: BoundingBox,
  supabase: OrchestratorDatabaseClient,
  fetcher: RestaurantFetcher,
): Promise<void> {
  const skip = await shouldSkipScan(bbox, supabase);
  if (skip) {
    return;
  }

  const restaurants = await fetcher.fetchRestaurants(bbox);

  if (restaurants.length > 0) {
    const { error: upsertError } = await supabase.from("restaurants").upsert(
      restaurants,
      { onConflict: "name,location" },
    );
    if (upsertError) throw upsertError;
  }

  const bboxString =
    `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
  const { error: historyError } = await supabase.from("scan_history").upsert(
    { bbox: bboxString, last_scan_date: new Date().toISOString() },
    { onConflict: "bbox" },
  );

  if (historyError) throw historyError;
}
