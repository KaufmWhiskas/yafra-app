import { assertEquals } from '@std/assert';
import { BoundingBox } from './scanner.ts';
import {
  fetchAndStoreRestaurants,
  OrchestratorDatabaseClient,
  RestaurantFetcher,
} from './service.ts';
import { RestaurantRecord } from './parser.ts';

const MOCK_USER_ID = 'user-123';

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
          insert: () =>
            Promise.resolve({ error: new Error('Not implemented') }),
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
          insert: () =>
            Promise.resolve({ error: new Error('Not implemented') }),
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
          insert: () => Promise.resolve({ error: null }),
          upsert: () => Promise.resolve({ error: null }),
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

    // Pretend tile 49471_8452 was scanned recently, but neighboring tiles are completely empty
    const { state, client } = createServiceMockSupabase([
      { tile_id: '49471_8452', last_scan_date: TWO_DAYS_AGO },
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

    // Expand bounding box slightly to cross into two tiles: 49471_8452 and 49471_8453
    const multiTileBbox: BoundingBox = {
      minLat: 49.4712,
      maxLat: 49.4718,
      minLon: 8.4521,
      maxLon: 8.4535, // Crosses boundary into 8453
    };

    await fetchAndStoreRestaurants(
      multiTileBbox,
      client,
      mockFetcher,
      MOCK_USER_ID,
    );

    // It should skip 49471_8452 entirely and ONLY execute a data request for 49471_8453
    assertEquals(fetchCalledWithBboxes.length, 1);
    assertEquals(state.insertedHistory.length, 1);
    assertEquals(state.insertedHistory[0].tile_id, '49471_8453');
    assertEquals(state.upsertedRestaurants.length, 1);
  },
);
