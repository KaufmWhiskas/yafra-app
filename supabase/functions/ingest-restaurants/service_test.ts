import { assertEquals } from "@std/assert";
import { BoundingBox } from "./scanner.ts";
import { fetchAndStoreRestaurants } from "./service.ts";
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
}

/** Strict interface for the mocked Supabase client */
export interface MockSupabaseOrchestrator {
  from: (table: string) => {
    select?: (columns: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<
        { data: { last_scan_date: string }[] | null; error: Error | null }
      >;
    };
    insert?: (data: { bbox: string }) => Promise<{ error: Error | null }>;
    upsert?: (
      data: RestaurantRecord | RestaurantRecord[],
    ) => Promise<{ error: Error | null }>;
  };
}

/** * Factory that creates a mock Supabase client for the orchestrator service
 * and exposes its internal state for assertions.
 */
function createServiceMockSupabase(
  scanHistoryResponse: {
    data: { last_scan_date: string }[] | null;
    error: Error | null;
  },
) {
  const state: MockDbState = {
    upsertedRestaurants: [],
    insertedHistory: [],
  };

  const client: MockSupabaseOrchestrator = {
    from: (table: string) => {
      if (table === "scan_history") {
        return {
          select: (_columns: string) => ({
            eq: (_col: string, _val: string) =>
              Promise.resolve(scanHistoryResponse),
          }),
          insert: (data: { bbox: string }) => {
            state.insertedHistory.push(data);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "restaurants") {
        return {
          upsert: (data: RestaurantRecord | RestaurantRecord[]) => {
            if (Array.isArray(data)) {
              state.upsertedRestaurants.push(...data);
            } else {
              state.upsertedRestaurants.push(data);
            }
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

  const mockFetch = ((_input: string | URL | Request, _init?: RequestInit) => {
    fetchCalled = true;
    return Promise.resolve(new Response());
  }) as typeof fetch;

  await fetchAndStoreRestaurants(TEST_BBOX, client, mockFetch);

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

  const mockFetch = ((_input: string | URL | Request, _init?: RequestInit) => {
    fetchCalled = true;
    const mockOsmData = {
      elements: [
        {
          type: "node",
          id: 1,
          lat: 47.35,
          lon: 8.55,
          tags: { name: "Test Cafe", cuisine: "coffee" },
        },
      ],
    };
    return Promise.resolve(new Response(JSON.stringify(mockOsmData)));
  }) as typeof fetch;

  await fetchAndStoreRestaurants(TEST_BBOX, client, mockFetch);

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
});
