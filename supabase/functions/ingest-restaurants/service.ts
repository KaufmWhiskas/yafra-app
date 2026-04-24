import { BoundingBox, shouldSkipScan } from "./scanner.ts";
import { parseOSMData, RestaurantRecord } from "./parser.ts";

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
      data: RestaurantRecord[],
      options?: { onConflict: string },
    ) => Promise<{ error: Error | null }>;
  };
}

/**
 * Orchestrates the fetching of OSM data and storing it in the database.
 * Skips the operation if the bounding box was scanned recently.
 * @param bbox The geographic bounding box to scan.
 * @param supabase The Supabase database client interface.
 * @param customFetch Optional fetch implementation for dependency injection.
 */
export async function fetchAndStoreRestaurants(
  bbox: BoundingBox,
  supabase: OrchestratorDatabaseClient,
  customFetch: typeof fetch = fetch,
): Promise<void> {
  const skip = await shouldSkipScan(bbox, supabase);
  if (skip) {
    return;
  }

  // Use 'nwr' (node, way, relation) to capture building footprints as well as points.
  const query = `[out:json];
(
  nwr["amenity"~"restaurant|cafe|fast_food|bar|pub"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
);
  out center;`;

  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${
    encodeURIComponent(
      query,
    )
  }`;

  const response = await customFetch(overpassUrl, {
    headers: {
      "User-Agent": "YAFRAApp/1.0 (local-dev)",
      "Accept": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Overpass API error: ${response.status} ${response.statusText}`,
    );
  }

  const osmData = await response.json();

  const restaurants = parseOSMData(osmData);

  if (restaurants.length > 0) {
    const { error: upsertError } = await supabase.from("restaurants").upsert(
      restaurants,
      { onConflict: "name,location" },
    );
    if (upsertError) throw upsertError;
  }

  const bboxString =
    `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
  const { error: historyError } = await supabase.from("scan_history").insert({
    bbox: bboxString,
  });

  if (historyError) throw historyError;
}
