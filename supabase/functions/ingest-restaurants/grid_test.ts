import { assertAlmostEquals, assertEquals } from '@std/assert';
import {
  coordinateToTileId,
  getIntersectingTiles,
  getSubTiles,
  getTileCenterAndRadius,
  GRID_STEP,
} from './grid.ts';
import { BoundingBox } from './scanner.ts';

Deno.test('GRID_STEP constant is strictly defined as 0.001 degrees', () => {
  assertEquals(GRID_STEP, 0.001);
});

Deno.test(
  'coordinateToTileId() snaps geographic coordinates to fixed grid string',
  () => {
    // 49.4715 / 0.001 = 49471.5 -> floor -> 49471
    // 8.4528 / 0.001 = 8452.8 -> floor -> 8452
    assertEquals(coordinateToTileId(49.4715, 8.4528), '49471_8452');

    // Handles negative coordinates correctly (math floor pushes down)
    assertEquals(coordinateToTileId(-49.4715, -8.4528), '-49472_-8453');

    // Exact boundary snaps to the tile it starts
    assertEquals(coordinateToTileId(49.47, 8.45), '49470_8450');
  },
);

Deno.test(
  'getIntersectingTiles() returns all tiles contained within or crossing a BoundingBox',
  () => {
    const bbox: BoundingBox = {
      minLat: 49.4712,
      maxLat: 49.4725, // Crosses from 49471 to 49472
      minLon: 8.4521,
      maxLon: 8.4534, // Crosses from 8452 to 8453
    };

    const expected = ['49471_8452', '49471_8453', '49472_8452', '49472_8453'];

    const result = getIntersectingTiles(bbox);
    assertEquals(result.sort(), expected.sort());
  },
);

Deno.test(
  'getIntersectingTiles() throws a RangeError if the requested viewport covers more than 25 base tiles',
  () => {
    const massiveBBox: BoundingBox = {
      minLat: 49.4,
      maxLat: 49.41, // 10 steps high
      minLon: 8.4,
      maxLon: 8.41, // 10 steps wide = 100 tiles total
    };

    try {
      getIntersectingTiles(massiveBBox);
      throw new Error('Test failed: Should have thrown a RangeError');
    } catch (error) {
      assertEquals(error instanceof RangeError, true);
      assertEquals(
        (error as RangeError).message.includes('Area too large'),
        true,
      );
    }
  },
);

Deno.test(
  'getTileCenterAndRadius() resolves exact center coordinates and a correct circumscribed radius in meters',
  () => {
    // Tile "49471_8452" means:
    // lat boundaries: [49.471, 49.472] -> Center: 49.4715
    // lon boundaries: [8.452, 8.453]   -> Center: 8.4525
    const tileId = '49471_8452';

    const { centerLat, centerLon, radiusMeters } =
      getTileCenterAndRadius(tileId);

    assertAlmostEquals(centerLat, 49.4715);
    assertAlmostEquals(centerLon, 8.4525);

    // A 0.001 x 0.001 degree square at this latitude has a diagonal corner distance
    // (from center to corner) of roughly 65-70 meters. The tile is not a perfect
    // square in meters due to latitude.
    assertEquals(
      radiusMeters > 65 && radiusMeters < 70,
      true,
      `Expected radius to be ~65-70m, but got ${radiusMeters}m`,
    );
  },
);

Deno.test('getSubTiles() splits a tile ID into four sub-quadrant IDs', () => {
  const tileId = '49471_8452';
  const expected = [
    '49471_8452_0', // Bottom-Left
    '49471_8452_1', // Bottom-Right
    '49471_8452_2', // Top-Left
    '49471_8452_3', // Top-Right
  ];

  const result = getSubTiles(tileId);
  assertEquals(result, expected);
});
