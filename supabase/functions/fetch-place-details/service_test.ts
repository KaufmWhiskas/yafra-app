import { assertEquals } from "@std/assert";
import { getOrFetchPlaceDetails } from "./service.ts";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

// Strict mock interface to avoid 'any'
export interface MockDatabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { details: unknown; details_updated_at: string | null } | null;
          error: Error | null;
        }>;
      };
    };
    update: (payload: { details: unknown; details_updated_at: string }) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
}

interface MockDbState {
  updateCalled: boolean;
}

function createMockSupabase(
  mockData: { details: unknown; details_updated_at: string | null } | null,
): { client: MockDatabaseClient; state: MockDbState } {
  const state: MockDbState = { updateCalled: false };

  const client: MockDatabaseClient = {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          maybeSingle: () => Promise.resolve({ data: mockData, error: null }),
        }),
      }),
      update: (_payload: { details: unknown; details_updated_at: string }) => ({
        eq: (_column: string, _value: string) => {
          state.updateCalled = true;
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };

  return { client, state };
}

Deno.test("Cache Hit (Fresh): returns cached data and skips Google API", async () => {
  const { client, state } = createMockSupabase({
    details: { rating: 4.8 },
    details_updated_at: new Date(Date.now() - TWO_DAYS_MS).toISOString(),
  });

  let fetchCalled = false;
  const mockFetchProDetails = () => {
    fetchCalled = true;
    return Promise.resolve({ rating: 5.0 });
  };

  const result = await getOrFetchPlaceDetails(
    "place_123",
    "DUMMY_KEY",
    client,
    mockFetchProDetails as unknown as typeof import("./fetcher.ts").fetchProDetails,
  );

  assertEquals(
    fetchCalled,
    false,
    "Should not call Google API for fresh cache",
  );
  assertEquals(
    state.updateCalled,
    false,
    "Should not update DB for fresh cache",
  );
  assertEquals((result as { rating: number }).rating, 4.8);
});

Deno.test("Cache Miss (Stale): fetches new details and updates DB", async () => {
  const { client, state } = createMockSupabase({
    details: { rating: 4.0 },
    details_updated_at: new Date(Date.now() - FIFTEEN_DAYS_MS).toISOString(),
  });

  let fetchCalled = false;
  const mockFetchProDetails = () => {
    fetchCalled = true;
    return Promise.resolve({ rating: 5.0 });
  };

  const result = await getOrFetchPlaceDetails(
    "place_123",
    "DUMMY_KEY",
    client,
    mockFetchProDetails as unknown as typeof import("./fetcher.ts").fetchProDetails,
  );

  assertEquals(fetchCalled, true, "Should call Google API for stale cache");
  assertEquals(state.updateCalled, true, "Should update DB with fresh data");
  assertEquals((result as { rating: number }).rating, 5.0);
});

Deno.test("Cache Miss (Empty): fetches new details and updates DB", async () => {
  const { client, state } = createMockSupabase(null);

  let fetchCalled = false;
  const mockFetchProDetails = () => {
    fetchCalled = true;
    return Promise.resolve({ rating: 5.0 });
  };

  const result = await getOrFetchPlaceDetails(
    "place_123",
    "DUMMY_KEY",
    client,
    mockFetchProDetails as unknown as typeof import("./fetcher.ts").fetchProDetails,
  );

  assertEquals(fetchCalled, true, "Should call Google API when cache is empty");
  assertEquals(state.updateCalled, true, "Should update DB with fresh data");
  assertEquals((result as { rating: number }).rating, 5.0);
});
