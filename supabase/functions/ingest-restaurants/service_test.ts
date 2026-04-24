import { assertEquals } from "@std/assert";
import { BoundingBox } from "./scanner.ts";
import {
  fetchAndStoreRestaurants,
  OrchestratorDatabaseClient,
  RestaurantFetcher,
} from "./service.ts";
import { RestaurantRecord } from "./parser.ts";

const TEST_BBOX: BoundingBox = {
  minLat: 47.3,
  minLon: 8.5,
  maxLat: 47.4,
  maxLon: 8.6,
};

/** Strict interface to avoid 'any' in our test state tracking */
interface MockDbState {
  upsertedRestaurants: RestaurantRecord[];
  insertedHistory: { bbox: string }[];
  upsertOptions?: { onConflict: string };
}

/** * Factory that creates a mock Supabase client for the orchestrator service
 * and exposes its internal state for assertions.
 */
function createServiceMockSupabase(
  scanHistoryResponse: {
    data: { last_scan_date: string }[] | null;
    error: Error | null;
  },
): { state: MockDbState; client: OrchestratorDatabaseClient } {
  const state: MockDbState = {
    upsertedRestaurants: [],
    insertedHistory: [],
  };

  const client: OrchestratorDatabaseClient = {
    from: (table: string) => {
      if (table === "scan_history") {
        return {
          select: (_columns: string) => ({
            eq: (_col: string, _val: string) =>
              Promise.resolve(scanHistoryResponse),
          }),
          insert: () =>
            Promise.resolve({ error: new Error("Not implemented") }),
          upsert: (
            data: RestaurantRecord[] | { bbox: string; last_scan_date: string },
            _options?: { onConflict: string },
          ) => {
            state.insertedHistory.push(
              data as { bbox: string; last_scan_date: string },
            );
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "restaurants") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: null,
                error: new Error("Not implemented"),
              }),
          }),
          insert: () =>
            Promise.resolve({ error: new Error("Not implemented") }),
          upsert: (
            data: RestaurantRecord[] | { bbox: string; last_scan_date: string },
            options?: { onConflict: string },
          ) => {
            state.upsertedRestaurants.push(...(data as RestaurantRecord[]));
            state.upsertOptions = options;
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Mock not implemented for table: ${table}`);
    },
  };

  return { state, client };
}

Deno.test("fetchAndStoreRestaurants() exits early if shouldSkipScan is true", async () => {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const { state, client } = createServiceMockSupabase({
    data: [{
      last_scan_date: new Date(Date.now() - TWO_DAYS_MS).toISOString(),
    }],
    error: null,
  });

  let fetchCalled = false;

  const mockFetcher: RestaurantFetcher = {
    fetchRestaurants: () => {
      fetchCalled = true;
      return Promise.resolve([]);
    },
  };

  await fetchAndStoreRestaurants(TEST_BBOX, client, mockFetcher);

  assertEquals(
    fetchCalled,
    false,
    "Fetch should not be called if scan is skipped",
  );
  assertEquals(state.upsertedRestaurants.length, 0);
  assertEquals(state.insertedHistory.length, 0);
});

Deno.test("fetchAndStoreRestaurants() fetches, parses, and stores data if scan is needed", async () => {
  const { state, client } = createServiceMockSupabase({
    data: [], // Empty data means no recent scan
    error: null,
  });

  let fetchCalled = false;

  const mockFetcher: RestaurantFetcher = {
    fetchRestaurants: () => {
      fetchCalled = true;
      return Promise.resolve([{
        name: "Test Cafe",
        cuisine: "coffee",
        location: "POINT(8.55 47.35)",
      }]);
    },
  };

  await fetchAndStoreRestaurants(TEST_BBOX, client, mockFetcher);

  assertEquals(fetchCalled, true, "Fetch should be called if scan is needed");
  assertEquals(
    state.upsertedRestaurants.length,
    1,
    "Should have upserted the restaurant data",
  );
  assertEquals(
    state.insertedHistory.length,
    1,
    "Should have logged the new scan in history",
  );
  assertEquals(
    state.upsertOptions?.onConflict,
    "google_place_id",
    "Should specify onConflict constraint",
  );
});
