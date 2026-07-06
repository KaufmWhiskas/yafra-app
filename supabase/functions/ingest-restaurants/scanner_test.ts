import { assertEquals } from '@std/assert';
import { BoundingBox, shouldSkipGridTile, shouldSkipScan } from './scanner.ts';

/** Minimal mock interface for Supabase client. */
export interface MockSupabase {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        data: { last_scan_date: string }[] | null;
        error: Error | null;
      }>;
    };
  };
}

const TEST_BBOX: BoundingBox = {
  minLat: 47.3,
  minLon: 8.5,
  maxLat: 47.4,
  maxLon: 8.6,
};

/**
 * Generates a mock Supabase client that resolves with the provided response
 * when queried for the expected bounding box.
 */
export function createMockSupabase(
  expectedBbox: BoundingBox,
  response: {
    data: { last_scan_date: string }[] | null;
    error: Error | null;
  },
): MockSupabase {
  const expectedBboxString = `${expectedBbox.minLat},${expectedBbox.minLon},${expectedBbox.maxLat},${expectedBbox.maxLon}`;

  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (column: string, value: string) => {
          if (
            table === 'scan_history' &&
            column === 'bbox' &&
            value === expectedBboxString
          ) {
            return Promise.resolve(response);
          }
          return Promise.resolve({
            data: null,
            error: new Error('Mock not configured for these args'),
          });
        },
      }),
    }),
  };
}

/**
 * Generates a mock Supabase client that resolves with the provided response
 * when queried for the expected tile ID.
 */
export function createGridMockSupabase(
  expectedTileId: string,
  response: {
    data: { last_scan_date: string }[] | null;
    error: Error | null;
  },
): MockSupabase {
  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (column: string, value: string) => {
          if (
            table === 'grid_history' &&
            column === 'tile_id' &&
            value === expectedTileId
          ) {
            return Promise.resolve(response);
          }
          return Promise.resolve({
            data: null,
            error: new Error('Mock not configured for these args'),
          });
        },
      }),
    }),
  };
}

Deno.test(
  'shouldSkipScan() returns true if a scan occurred within the last 14 days',
  async () => {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const mockSupabaseClient = createMockSupabase(TEST_BBOX, {
      data: [
        { last_scan_date: new Date(Date.now() - TWO_DAYS_MS).toISOString() },
      ],
      error: null,
    });

    const result = await shouldSkipScan(TEST_BBOX, mockSupabaseClient);
    assertEquals(result, true);
  },
);

Deno.test(
  'shouldSkipScan() returns false if no record exists for the bounding box',
  async () => {
    const mockSupabaseClient = createMockSupabase(TEST_BBOX, {
      data: [],
      error: null,
    });

    const result = await shouldSkipScan(TEST_BBOX, mockSupabaseClient);
    assertEquals(result, false);
  },
);

Deno.test(
  'shouldSkipGridTile() returns false if the tile has never been scanned before',
  async () => {
    const mockDb = createGridMockSupabase('49471_8452', {
      data: [],
      error: null,
    });

    const skip = await shouldSkipGridTile('49471_8452', mockDb);
    assertEquals(skip, false);
  },
);

Deno.test(
  'shouldSkipGridTile() returns false if the tile was scanned more than 14 days ago',
  async () => {
    const FIFTEEN_DAYS_AGO = new Date(
      Date.now() - 15 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const mockDb = createGridMockSupabase('49471_8452', {
      data: [{ last_scan_date: FIFTEEN_DAYS_AGO }],
      error: null,
    });

    const skip = await shouldSkipGridTile('49471_8452', mockDb);
    assertEquals(skip, false);
  },
);

Deno.test(
  'shouldSkipGridTile() returns true if the tile was scanned within the last 14 days',
  async () => {
    const TWO_DAYS_AGO = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const mockDb = createGridMockSupabase('49471_8452', {
      data: [{ last_scan_date: TWO_DAYS_AGO }],
      error: null,
    });

    const skip = await shouldSkipGridTile('49471_8452', mockDb);
    assertEquals(skip, true);
  },
);

Deno.test(
  'shouldSkipScan() returns false if the record is older than 14 days',
  async () => {
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const mockSupabaseClient = createMockSupabase(TEST_BBOX, {
      data: [
        {
          last_scan_date: new Date(Date.now() - FIFTEEN_DAYS_MS).toISOString(),
        },
      ],
      error: null,
    });

    const result = await shouldSkipScan(TEST_BBOX, mockSupabaseClient);
    assertEquals(result, false);
  },
);
