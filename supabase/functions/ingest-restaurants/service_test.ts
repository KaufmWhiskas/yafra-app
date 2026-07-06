import { assertEquals } from '@std/assert';
import { BoundingBox } from './scanner.ts';
import {
  fetchAndStoreRestaurants,
  OrchestratorDatabaseClient,
  RestaurantFetcher,
} from './service.ts';
import { RestaurantRecord } from './parser.ts';

const MOCK_USER_ID = 'user-123';

const TEST_BBOX: BoundingBox = {
  minLat: 49.4712,
  maxLat: 49.4718, // Fits within tile 49471
  minLon: 8.4521,
  maxLon: 8.4528, // Fits within tile 8452
};

interface MockDbState {
  upsertedRestaurants: RestaurantRecord[];
  insertedHistory: { tile_id: string; last_scan_date: string }[];
  rpcCalls: { name: string; args: Record<string, unknown> }[];
}

function createServiceMockSupabase(
  gridHistoryData: { tile_id: string; last_scan_date: string }[],
): { state: MockDbState; client: OrchestratorDatabaseClient } {
  const state: MockDbState = {
    upsertedRestaurants: [],
    insertedHistory: [],
    rpcCalls: [],
  };

  const client: OrchestratorDatabaseClient = {
    from: (table: string) => {
      if (table === 'grid_history') {
        return {
          select: (_columns: string) => ({
            eq: (_col: string, tileId: string) => {
              const matched = gridHistoryData.filter(
                (h) => h.tile_id === tileId,
              );
              return Promise.resolve({ data: matched, error: null });
            },
          }),
          insert: (
            _data:
              | { bbox: string }
              | { tile_id: string; last_scan_date: string },
          ) => Promise.resolve({ error: new Error('Not implemented') }),
          upsert: (
            data:
              | RestaurantRecord[]
              | { bbox: string; last_scan_date: string }
              | { tile_id: string; last_scan_date: string },
            _options?: { onConflict: string },
          ) => {
            state.insertedHistory.push(
              data as { tile_id: string; last_scan_date: string },
            );
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === 'restaurants') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: null,
                error: new Error('Not implemented'),
              }),
          }),
          insert: (
            _data:
              | { bbox: string }
              | { tile_id: string; last_scan_date: string },
          ) => Promise.resolve({ error: new Error('Not implemented') }),
          upsert: (
            data:
              | RestaurantRecord[]
              | { bbox: string; last_scan_date: string }
              | { tile_id: string; last_scan_date: string },
            _options?: { onConflict: string },
          ) => {
            state.upsertedRestaurants.push(...(data as RestaurantRecord[]));
            return Promise.resolve({ error: null });
          },
        };
      }
      // Stub the old scan_history layout with empty fallbacks to keep shouldSkipScan from crashing
      if (table === 'scan_history') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
          insert: (
            _data:
              | { bbox: string }
              | { tile_id: string; last_scan_date: string },
          ) => Promise.resolve({ error: null }),
          upsert: (
            _data:
              | RestaurantRecord[]
              | { bbox: string; last_scan_date: string }
              | { tile_id: string; last_scan_date: string },
            _options?: { onConflict: string },
          ) => Promise.resolve({ error: null }),
        };
      }
      throw new Error(`Mock not implemented for table: ${table}`);
    },
    rpc: (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      return Promise.resolve({ data: true, error: null });
    },
  };

  return { state, client };
}

Deno.test(
  'fetchAndStoreRestaurants() maps viewport to grids, filters cached rows, and saves unmapped tiles',
  async () => {
    const TWO_DAYS_AGO = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Pretend tile 9894_1690 was scanned recently, but neighboring tiles are completely empty
    const { state, client } = createServiceMockSupabase([
      { tile_id: '9894_1690', last_scan_date: TWO_DAYS_AGO },
    ]);

    const fetchCalledWithBboxes: BoundingBox[] = [];

    const mockFetcher: RestaurantFetcher = {
      fetchData: (bbox: BoundingBox) => {
        fetchCalledWithBboxes.push(bbox);
        return Promise.resolve([
          {
            name: 'Grid Bound Eatery',
            google_place_id: 'g-place-456',
            location: 'POINT(8.4525 49.4715)',
          },
        ]);
      },
    };

    // Expand bounding box to cross from tile 1690 to 1691
    const multiTileBbox: BoundingBox = {
      minLat: 49.4712,
      maxLat: 49.4718,
      minLon: 8.4521,
      maxLon: 8.456, // Crosses boundary into tile 1691
    };

    await fetchAndStoreRestaurants(
      multiTileBbox,
      client,
      mockFetcher,
      MOCK_USER_ID,
    );

    // It should skip 9894_1690 entirely and ONLY execute a data request for 9894_1691
    assertEquals(fetchCalledWithBboxes.length, 1);
    assertEquals(state.insertedHistory.length, 1);
    assertEquals(state.insertedHistory[0].tile_id, '9894_1691');
    assertEquals(state.upsertedRestaurants.length, 1);
  },
);

Deno.test(
  'fetchAndStoreRestaurants() recursively subdivides a tile if exactly 20 restaurants are returned',
  async () => {
    const { state, client } = createServiceMockSupabase([]);

    let fetchCount = 0;
    const mockFetcher: RestaurantFetcher = {
      fetchData: (_bbox: BoundingBox) => {
        fetchCount++;
        // First call (parent tile): simulate a full cutoff of 20 places
        if (fetchCount === 1) {
          return Promise.resolve(
            Array(20).fill({
              name: 'Cutoff Place',
              google_place_id: 'fake-id',
              location: 'POINT(8.4525 49.4715)',
            }),
          );
        }
        // Subsequent sub-quadrant calls: return low density to end recursion
        return Promise.resolve([
          {
            name: 'Sub-Quadrant Place',
            google_place_id: `sub-id-${fetchCount}`,
            location: 'POINT(8.4525 49.4715)',
          },
        ]);
      },
    };

    // Run on a single precise tile bbox bounds configuration
    await fetchAndStoreRestaurants(
      TEST_BBOX,
      client,
      mockFetcher,
      MOCK_USER_ID,
    );

    // Expect 1 parent call + 4 sub-quadrant quadrant branch queries = 5 fetches total
    assertEquals(
      fetchCount,
      5,
      'Should have triggered recursive sub-quadrant scans',
    );

    // The parent tile ID should NOT be marked complete because it was split!
    // Instead, the 4 child tiles should be logged in history.
    const hasParent = state.insertedHistory.some(
      (h) => h.tile_id === '9894_1690',
    );
    assertEquals(
      hasParent,
      false,
      'Should not mark a saturated parent tile as completely mapped',
    );
    assertEquals(
      state.insertedHistory.length,
      4,
      'Should record history for all 4 sub-tiles',
    );
  },
);
